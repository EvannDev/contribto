package main

import (
	"context"
	"encoding/base64"
	"errors"
	"log/slog"
	"os"
	"time"

	"github.com/gofiber/fiber/v3"
	"github.com/gofiber/fiber/v3/middleware/cors"
	"github.com/gofiber/fiber/v3/middleware/encryptcookie"
	"github.com/gofiber/fiber/v3/middleware/healthcheck"
	"github.com/gofiber/fiber/v3/middleware/helmet"
	"github.com/gofiber/fiber/v3/middleware/limiter"
	"github.com/gofiber/fiber/v3/middleware/logger"
	"github.com/gofiber/fiber/v3/middleware/recover"

	"github.com/EvannDev/contribto/internal/github"
	httphandler "github.com/EvannDev/contribto/internal/http"
	"github.com/EvannDev/contribto/internal/repo"
	"github.com/EvannDev/contribto/internal/scan"
)

type config struct {
	GithubClientID      string
	GithubClientSecret  string
	GithubWorkerPAT     string
	TokenEncryptionKey  string
	CookieEncryptionKey string
	FrontendOrigin      string
	DBPath              string
	Port                string
}

func loadConfig() config {
	cfg := config{
		GithubClientID:      os.Getenv("GITHUB_CLIENT_ID"),
		GithubClientSecret:  os.Getenv("GITHUB_CLIENT_SECRET"),
		GithubWorkerPAT:     os.Getenv("GITHUB_WORKER_PAT"),
		TokenEncryptionKey:  os.Getenv("TOKEN_ENCRYPTION_KEY"),
		CookieEncryptionKey: os.Getenv("COOKIE_ENCRYPTION_KEY"),
		FrontendOrigin:      os.Getenv("FRONTEND_ORIGIN"),
		DBPath:              os.Getenv("DB_PATH"),
		Port:                os.Getenv("PORT"),
	}

	required := map[string]string{
		"GITHUB_CLIENT_ID":      cfg.GithubClientID,
		"GITHUB_CLIENT_SECRET":  cfg.GithubClientSecret,
		"TOKEN_ENCRYPTION_KEY":  cfg.TokenEncryptionKey,
		"COOKIE_ENCRYPTION_KEY": cfg.CookieEncryptionKey,
	}
	for name, val := range required {
		if val == "" {
			slog.Error("missing required env var", "name", name)
			os.Exit(1)
		}
	}

	if cfg.DBPath == "" {
		cfg.DBPath = "./app.db"
	}
	if cfg.Port == "" {
		cfg.Port = "8080"
	}
	if cfg.FrontendOrigin == "" {
		cfg.FrontendOrigin = "http://localhost:3000"
	}

	return cfg
}

func jsonErrorHandler(c fiber.Ctx, err error) error {
	code := fiber.StatusInternalServerError
	msg := "internal server error"

	var ferr *fiber.Error
	if ok := errors.As(err, &ferr); ok {
		code = ferr.Code
		msg = ferr.Message
	}

	return c.Status(code).JSON(fiber.Map{"error": msg})
}

func main() {
	cfg := loadConfig()

	db, err := repo.OpenDB(cfg.DBPath)
	if err != nil {
		slog.Error("open db", "err", err)
		os.Exit(1)
	}
	defer db.Close()

	repository := repo.NewSQLiteRepo(db)
	ghClient := github.NewClient(cfg.GithubClientID, cfg.GithubClientSecret)

	encKey, err := base64.StdEncoding.DecodeString(cfg.TokenEncryptionKey)
	if err != nil {
		slog.Error("decode TOKEN_ENCRYPTION_KEY", "err", err)
		os.Exit(1)
	}

	if cfg.GithubWorkerPAT != "" {
		worker := scan.NewWorker(repository, ghClient, cfg.GithubWorkerPAT)
		go worker.Start(context.Background())
	} else {
		slog.Warn("GITHUB_WORKER_PAT not set — scan worker disabled")
	}

	h := httphandler.NewHandler(repository, ghClient, encKey)

	app := fiber.New(fiber.Config{ErrorHandler: jsonErrorHandler})
	app.Use(logger.New())
	app.Use(recover.New())
	app.Use(limiter.New(limiter.Config{
		Max:        120,
		Expiration: time.Minute,
		LimitReached: func(c fiber.Ctx) error {
			return c.Status(fiber.StatusTooManyRequests).JSON(fiber.Map{"error": "too many requests"})
		},
	}))
	app.Use(encryptcookie.New(encryptcookie.Config{
		Key: cfg.CookieEncryptionKey,
	}))
	app.Use(cors.New(cors.Config{
		AllowOrigins:     []string{cfg.FrontendOrigin},
		AllowCredentials: true,
	}))
	app.Use(helmet.New())
	app.Get(healthcheck.LivenessEndpoint, healthcheck.New())
	app.Get(healthcheck.ReadinessEndpoint, healthcheck.New())

	app.Post("/auth/github", h.PostAuthGitHub)
	app.Post("/auth/logout", h.PostAuthLogout)

	protected := app.Group("/", httphandler.RequireAuth())
	protected.Get("/me", h.GetMe)
	protected.Delete("/me", h.DeleteAccount)
	protected.Get("/issues", h.GetIssues)
	protected.Post("/sync-stars", h.PostSyncStars)

	slog.Info("starting", "port", cfg.Port)
	if err := app.Listen(":" + cfg.Port); err != nil {
		slog.Error("listen", "err", err)
		os.Exit(1)
	}
}

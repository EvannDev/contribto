package main

import (
	"encoding/base64"
	"errors"
	"log/slog"
	"os"

	"github.com/gofiber/fiber/v3"
	"github.com/gofiber/fiber/v3/middleware/cors"
	"github.com/gofiber/fiber/v3/middleware/encryptcookie"
	"github.com/gofiber/fiber/v3/middleware/logger"
	"github.com/gofiber/fiber/v3/middleware/recover"

	"github.com/EvannDev/hellocommit/internal/github"
	httphandler "github.com/EvannDev/hellocommit/internal/http"
	"github.com/EvannDev/hellocommit/internal/repo"
)

type config struct {
	GithubClientID     string
	GithubClientSecret string
	TokenEncryptionKey string
	CookieEncryptionKey string
	FrontendOrigin     string
	DBPath             string
	Port               string
}

func loadConfig() config {
	cfg := config{
		GithubClientID:      os.Getenv("GITHUB_CLIENT_ID"),
		GithubClientSecret:  os.Getenv("GITHUB_CLIENT_SECRET"),
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

	h := httphandler.NewHandler(repository, ghClient, encKey)

	app := fiber.New(fiber.Config{ErrorHandler: jsonErrorHandler})
	app.Use(logger.New())
	app.Use(recover.New())
	app.Use(encryptcookie.New(encryptcookie.Config{
		Key: cfg.CookieEncryptionKey,
	}))
	app.Use(cors.New(cors.Config{
		AllowOrigins:     []string{cfg.FrontendOrigin},
		AllowCredentials: true,
	}))

	app.Post("/auth/github", h.PostAuthGitHub)

	// Protected group — no endpoints yet, added in Step 6.
	protected := app.Group("/", httphandler.RequireAuth())
	_ = protected

	slog.Info("starting", "port", cfg.Port)
	if err := app.Listen(":" + cfg.Port); err != nil {
		slog.Error("listen", "err", err)
		os.Exit(1)
	}
}

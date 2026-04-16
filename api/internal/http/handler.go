package http

import (
	"log/slog"
	"net/http"
	"strconv"
	"time"

	"github.com/gofiber/fiber/v3"

	"github.com/EvannDev/hellocommit/internal/crypto"
	"github.com/EvannDev/hellocommit/internal/domain"
	"github.com/EvannDev/hellocommit/internal/github"
	"github.com/EvannDev/hellocommit/internal/repo"
)

const sessionCookieName = "session"

// Handler holds the dependencies shared across all HTTP handlers.
type Handler struct {
	repo          repo.Repository
	gh            *github.Client
	encryptionKey []byte
}

// NewHandler creates a Handler with the given dependencies.
func NewHandler(r repo.Repository, gh *github.Client, encKey []byte) *Handler {
	return &Handler{repo: r, gh: gh, encryptionKey: encKey}
}

// PostAuthGitHub handles POST /auth/github.
// Expects JSON body: {"code": "<oauth_code>"}
// On success: sets an encrypted session cookie and returns {"login": "<github_login>"}.
func (h *Handler) PostAuthGitHub(c fiber.Ctx) error {
	var dto struct {
		Code string `json:"code"`
	}
	if err := c.Bind().Body(&dto); err != nil {
		return fiber.NewError(http.StatusBadRequest, "invalid request body")
	}
	if dto.Code == "" {
		return fiber.NewError(http.StatusBadRequest, "code is required")
	}

	ctx := c.Context()

	token, err := h.gh.ExchangeCode(ctx, dto.Code)
	if err != nil {
		return fiber.NewError(http.StatusUnauthorized, "failed to exchange GitHub code")
	}

	ghUser, err := h.gh.GetUser(ctx, token)
	if err != nil {
		return fiber.NewError(http.StatusUnauthorized, "failed to fetch GitHub user")
	}

	encryptedToken, err := crypto.Encrypt(h.encryptionKey, []byte(token))
	if err != nil {
		slog.Error("encrypt token", "err", err)
		return fiber.NewError(http.StatusInternalServerError, "internal error")
	}

	user := &domain.User{
		GithubID:       ghUser.ID,
		GithubLogin:    ghUser.Login,
		EncryptedToken: encryptedToken,
	}
	if err := h.repo.UpsertUser(ctx, user); err != nil {
		slog.Error("upsert user", "err", err)
		return fiber.NewError(http.StatusInternalServerError, "internal error")
	}

	c.Cookie(&fiber.Cookie{
		Name:     sessionCookieName,
		Value:    strconv.FormatInt(user.ID, 10),
		HTTPOnly: true,
		SameSite: "Lax",
		Path:     "/",
		MaxAge:   int(7 * 24 * time.Hour / time.Second),
	})

	return c.JSON(fiber.Map{"login": ghUser.Login})
}

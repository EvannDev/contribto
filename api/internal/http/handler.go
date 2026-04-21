package http

import (
	"log/slog"
	"net/http"
	"strconv"
	"time"

	"github.com/gofiber/fiber/v3"

	"github.com/EvannDev/contribto/internal/crypto"
	"github.com/EvannDev/contribto/internal/domain"
	"github.com/EvannDev/contribto/internal/github"
	"github.com/EvannDev/contribto/internal/repo"
)

const sessionCookieName = "session"

type issueRepoDTO struct {
	FullName string `json:"full_name"`
	Language string `json:"language"`
	Stars    int    `json:"stars"`
}

type issueDTO struct {
	ID        int64        `json:"id"`
	Number    int          `json:"number"`
	Title     string       `json:"title"`
	URL       string       `json:"url"`
	Repo      issueRepoDTO `json:"repo"`
	Labels    []string     `json:"labels"`
	CreatedAt *time.Time   `json:"created_at"`
	UpdatedAt *time.Time   `json:"updated_at"`
}

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

// PostAuthLogout handles POST /auth/logout.
// Clears the session cookie and returns 200.
func (h *Handler) PostAuthLogout(c fiber.Ctx) error {
	c.Cookie(&fiber.Cookie{
		Name:     sessionCookieName,
		Value:    "",
		MaxAge:   -1,
		HTTPOnly: true,
		SameSite: "Lax",
		Path:     "/",
	})
	return c.SendStatus(fiber.StatusOK)
}

// GetIssues handles GET /issues (auth required).
// Query params: limit (default 50, max 100), offset (default 0).
func (h *Handler) GetIssues(c fiber.Ctx) error {
	userID := UserIDFromContext(c)
	ctx := c.Context()

	var q struct {
		Limit  int `query:"limit"`
		Offset int `query:"offset"`
	}
	q.Limit = 50
	q.Offset = 0
	if err := c.Bind().Query(&q); err != nil {
		return fiber.NewError(http.StatusBadRequest, "invalid query params")
	}
	if q.Limit <= 0 || q.Limit > 100 {
		q.Limit = 50
	}
	if q.Offset < 0 {
		q.Offset = 0
	}

	issues, err := h.repo.GetOpenIssuesWithRepo(ctx, userID, q.Limit, q.Offset)
	if err != nil {
		slog.Error("get open issues with repo", "err", err)
		return fiber.NewError(http.StatusInternalServerError, "internal error")
	}

	total, err := h.repo.CountOpenIssuesForUser(ctx, userID)
	if err != nil {
		slog.Error("count open issues", "err", err)
		return fiber.NewError(http.StatusInternalServerError, "internal error")
	}

	dtos := make([]issueDTO, len(issues))
	for i, iss := range issues {
		labels := iss.Labels
		if labels == nil {
			labels = []string{}
		}
		dtos[i] = issueDTO{
			ID:     iss.ID,
			Number: iss.Number,
			Title:  iss.Title,
			URL:    iss.URL,
			Repo: issueRepoDTO{
				FullName: iss.RepoFullName,
				Language: iss.RepoLanguage,
				Stars:    iss.RepoStars,
			},
			Labels:    labels,
			CreatedAt: iss.CreatedAt,
			UpdatedAt: iss.UpdatedAt,
		}
	}

	return c.JSON(fiber.Map{"issues": dtos, "total": total})
}

// GetMe handles GET /me (auth required).
// Returns the current user's GitHub login and ID.
func (h *Handler) GetMe(c fiber.Ctx) error {
	userID := UserIDFromContext(c)
	ctx := c.Context()

	user, err := h.repo.GetUserByID(ctx, userID)
	if err != nil {
		slog.Error("get user by id", "err", err)
		return fiber.NewError(http.StatusInternalServerError, "internal error")
	}
	if user == nil {
		return fiber.NewError(http.StatusUnauthorized, "unauthorized")
	}

	return c.JSON(fiber.Map{"login": user.GithubLogin, "github_id": user.GithubID})
}

// PostSyncStars handles POST /sync-stars (auth required).
// Fetches the user's starred repos from GitHub and upserts them into the DB.
func (h *Handler) PostSyncStars(c fiber.Ctx) error {
	userID := UserIDFromContext(c)
	ctx := c.Context()

	user, err := h.repo.GetUserByID(ctx, userID)
	if err != nil {
		slog.Error("get user by id", "err", err)
		return fiber.NewError(http.StatusInternalServerError, "internal error")
	}
	if user == nil {
		return fiber.NewError(http.StatusUnauthorized, "unauthorized")
	}

	token, err := crypto.Decrypt(h.encryptionKey, user.EncryptedToken)
	if err != nil {
		slog.Error("decrypt token", "userID", userID, "err", err)
		return fiber.NewError(http.StatusInternalServerError, "internal error")
	}

	ghRepos, err := h.gh.GetStarredRepos(ctx, string(token))
	if err != nil {
		slog.Error("fetch starred repos", "userID", userID, "err", err)
		return fiber.NewError(http.StatusBadGateway, "failed to fetch starred repos from GitHub")
	}

	for _, ghRepo := range ghRepos {
		r := &domain.Repo{
			GithubID:    ghRepo.ID,
			FullName:    ghRepo.FullName,
			Description: ghRepo.Description,
			Language:    ghRepo.Language,
			StarsCount:  ghRepo.StargazersCount,
		}
		if err := h.repo.UpsertRepo(ctx, r); err != nil {
			slog.Error("upsert repo", "repo", ghRepo.FullName, "err", err)
			return fiber.NewError(http.StatusInternalServerError, "internal error")
		}
		if err := h.repo.LinkUserToRepo(ctx, userID, r.ID, nil); err != nil {
			slog.Error("link user to repo", "repo", ghRepo.FullName, "err", err)
			return fiber.NewError(http.StatusInternalServerError, "internal error")
		}
	}

	if err := h.repo.UpdateUserSyncedAt(ctx, userID, time.Now()); err != nil {
		slog.Error("update user synced at", "userID", userID, "err", err)
	}

	slog.Info("sync stars done", "userID", userID, "synced", len(ghRepos))
	return c.JSON(fiber.Map{"synced": len(ghRepos)})
}

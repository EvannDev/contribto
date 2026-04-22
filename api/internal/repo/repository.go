package repo

import (
	"context"
	"time"

	"github.com/EvannDev/contribto/internal/domain"
)

// Repository is the single interface through which all DB access happens.
// The implementation is SQLite today; swap it for Postgres without touching
// any business logic.
type Repository interface {
	// Users
	GetUserByID(ctx context.Context, userID int64) (*domain.User, error)
	GetUserByGithubID(ctx context.Context, githubID int64) (*domain.User, error)
	UpsertUser(ctx context.Context, u *domain.User) error
	UpdateUserToken(ctx context.Context, userID int64, encryptedToken []byte) error
	UpdateUserSyncedAt(ctx context.Context, userID int64, t time.Time) error
	DeleteUser(ctx context.Context, userID int64) error

	// Repos
	UpsertRepo(ctx context.Context, r *domain.Repo) error
	GetReposToScan(ctx context.Context, olderThan time.Time, limit int) ([]domain.Repo, error)
	UpdateRepoScanned(ctx context.Context, repoID int64, etag string, t time.Time) error

	// Stars
	LinkUserToRepo(ctx context.Context, userID, repoID int64, starredAt *time.Time) error
	GetUserStarredRepos(ctx context.Context, userID int64) ([]domain.Repo, error)

	// Issues
	UpsertIssue(ctx context.Context, issue *domain.Issue) error
	MarkIssuesClosed(ctx context.Context, repoID int64, openGithubIDs []int64) error
	GetOpenIssuesForUser(ctx context.Context, userID int64, limit, offset int) ([]domain.Issue, error)
	GetOpenIssuesWithRepo(ctx context.Context, userID int64, sort string, limit, offset int) ([]domain.IssueWithRepo, error)
	CountOpenIssuesForUser(ctx context.Context, userID int64) (int, error)
}

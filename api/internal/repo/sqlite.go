package repo

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"time"

	dbsqlc "github.com/EvannDev/contribto/db/sqlc"
	"github.com/EvannDev/contribto/internal/domain"
)

// SQLiteRepo implements Repository using the sqlc-generated query layer.
type SQLiteRepo struct {
	db *sql.DB
	q  *dbsqlc.Queries
}

func NewSQLiteRepo(db *sql.DB) *SQLiteRepo {
	return &SQLiteRepo{db: db, q: dbsqlc.New(db)}
}

// --- Users ---

func (r *SQLiteRepo) GetUserByID(ctx context.Context, userID int64) (*domain.User, error) {
	row, err := r.q.GetUserByID(ctx, userID)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("get user by id: %w", err)
	}
	return userFromRow(row), nil
}

func (r *SQLiteRepo) GetUserByGithubID(ctx context.Context, githubID int64) (*domain.User, error) {
	row, err := r.q.GetUserByGithubID(ctx, githubID)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("get user by github id: %w", err)
	}
	return userFromRow(row), nil
}

func (r *SQLiteRepo) UpsertUser(ctx context.Context, u *domain.User) error {
	id, err := r.q.UpsertUser(ctx, dbsqlc.UpsertUserParams{
		GithubID:       u.GithubID,
		GithubLogin:    u.GithubLogin,
		EncryptedToken: u.EncryptedToken,
	})
	if err != nil {
		return fmt.Errorf("upsert user: %w", err)
	}
	u.ID = id
	return nil
}

func (r *SQLiteRepo) UpdateUserToken(ctx context.Context, userID int64, encryptedToken []byte) error {
	if err := r.q.UpdateUserToken(ctx, dbsqlc.UpdateUserTokenParams{
		EncryptedToken: encryptedToken,
		ID:             userID,
	}); err != nil {
		return fmt.Errorf("update user token: %w", err)
	}
	return nil
}

func (r *SQLiteRepo) UpdateUserSyncedAt(ctx context.Context, userID int64, t time.Time) error {
	if err := r.q.UpdateUserSyncedAt(ctx, dbsqlc.UpdateUserSyncedAtParams{
		LastSyncedAt: sql.NullTime{Time: t, Valid: true},
		ID:           userID,
	}); err != nil {
		return fmt.Errorf("update user synced at: %w", err)
	}
	return nil
}

// --- Repos ---

func (r *SQLiteRepo) UpsertRepo(ctx context.Context, repo *domain.Repo) error {
	id, err := r.q.UpsertRepo(ctx, dbsqlc.UpsertRepoParams{
		GithubID:    repo.GithubID,
		FullName:    repo.FullName,
		Description: sql.NullString{String: repo.Description, Valid: repo.Description != ""},
		Language:    sql.NullString{String: repo.Language, Valid: repo.Language != ""},
		StarsCount:  sql.NullInt64{Int64: int64(repo.StarsCount), Valid: true},
	})
	if err != nil {
		return fmt.Errorf("upsert repo: %w", err)
	}
	repo.ID = id
	return nil
}

func (r *SQLiteRepo) GetReposToScan(ctx context.Context, olderThan time.Time, limit int) ([]domain.Repo, error) {
	rows, err := r.q.GetReposToScan(ctx, dbsqlc.GetReposToScanParams{
		LastScannedAt: sql.NullTime{Time: olderThan, Valid: true},
		Limit:         int64(limit),
	})
	if err != nil {
		return nil, fmt.Errorf("get repos to scan: %w", err)
	}
	repos := make([]domain.Repo, len(rows))
	for i, row := range rows {
		repos[i] = repoFromRow(row)
	}
	return repos, nil
}

func (r *SQLiteRepo) UpdateRepoScanned(ctx context.Context, repoID int64, etag string, t time.Time) error {
	if err := r.q.UpdateRepoScanned(ctx, dbsqlc.UpdateRepoScannedParams{
		Etag:          sql.NullString{String: etag, Valid: etag != ""},
		LastScannedAt: sql.NullTime{Time: t, Valid: true},
		ID:            repoID,
	}); err != nil {
		return fmt.Errorf("update repo scanned: %w", err)
	}
	return nil
}

// --- Stars ---

func (r *SQLiteRepo) LinkUserToRepo(ctx context.Context, userID, repoID int64, starredAt *time.Time) error {
	p := dbsqlc.LinkUserToRepoParams{UserID: userID, RepoID: repoID}
	if starredAt != nil {
		p.StarredAt = sql.NullTime{Time: *starredAt, Valid: true}
	}
	if err := r.q.LinkUserToRepo(ctx, p); err != nil {
		return fmt.Errorf("link user to repo: %w", err)
	}
	return nil
}

func (r *SQLiteRepo) GetUserStarredRepos(ctx context.Context, userID int64) ([]domain.Repo, error) {
	rows, err := r.q.GetUserStarredRepos(ctx, userID)
	if err != nil {
		return nil, fmt.Errorf("get user starred repos: %w", err)
	}
	repos := make([]domain.Repo, len(rows))
	for i, row := range rows {
		repos[i] = repoFromRow(row)
	}
	return repos, nil
}

// --- Issues ---

func (r *SQLiteRepo) UpsertIssue(ctx context.Context, issue *domain.Issue) error {
	p := dbsqlc.UpsertIssueParams{
		GithubID:   issue.GithubID,
		RepoID:     issue.RepoID,
		Number:     int64(issue.Number),
		Title:      issue.Title,
		Url:        issue.URL,
		Labels:     sql.NullString{String: labelsToJSON(issue.Labels), Valid: true},
		IsOpen:     boolToInt(issue.IsOpen),
		LastSeenAt: issue.LastSeenAt,
	}
	if issue.CreatedAtGithub != nil {
		p.CreatedAtGithub = sql.NullTime{Time: *issue.CreatedAtGithub, Valid: true}
	}
	if issue.UpdatedAtGithub != nil {
		p.UpdatedAtGithub = sql.NullTime{Time: *issue.UpdatedAtGithub, Valid: true}
	}
	if err := r.q.UpsertIssue(ctx, p); err != nil {
		return fmt.Errorf("upsert issue: %w", err)
	}
	return nil
}

func (r *SQLiteRepo) MarkIssuesClosed(ctx context.Context, repoID int64, openGithubIDs []int64) error {
	if err := r.q.MarkIssuesClosed(ctx, dbsqlc.MarkIssuesClosedParams{
		RepoID:        repoID,
		OpenGithubIds: openGithubIDs,
	}); err != nil {
		return fmt.Errorf("mark issues closed: %w", err)
	}
	return nil
}

func (r *SQLiteRepo) GetOpenIssuesForUser(ctx context.Context, userID int64, limit, offset int) ([]domain.Issue, error) {
	rows, err := r.q.GetOpenIssuesForUser(ctx, dbsqlc.GetOpenIssuesForUserParams{
		UserID: userID,
		Limit:  int64(limit),
		Offset: int64(offset),
	})
	if err != nil {
		return nil, fmt.Errorf("get open issues for user: %w", err)
	}
	issues := make([]domain.Issue, len(rows))
	for i, row := range rows {
		issues[i] = issueFromRow(row)
	}
	return issues, nil
}

func (r *SQLiteRepo) GetOpenIssuesWithRepo(ctx context.Context, userID int64, sort string, limit, offset int) ([]domain.IssueWithRepo, error) {
	p := dbsqlc.GetOpenIssuesWithRepoParams{UserID: userID, Limit: int64(limit), Offset: int64(offset)}
	var rows []dbsqlc.GetOpenIssuesWithRepoRow
	var err error
	switch sort {
	case "updated_asc":
		var r2 []dbsqlc.GetOpenIssuesWithRepoByUpdatedAscRow
		r2, err = r.q.GetOpenIssuesWithRepoByUpdatedAsc(ctx, dbsqlc.GetOpenIssuesWithRepoByUpdatedAscParams(p))
		for _, row := range r2 {
			rows = append(rows, dbsqlc.GetOpenIssuesWithRepoRow(row))
		}
	case "created_desc":
		var r2 []dbsqlc.GetOpenIssuesWithRepoByCreatedDescRow
		r2, err = r.q.GetOpenIssuesWithRepoByCreatedDesc(ctx, dbsqlc.GetOpenIssuesWithRepoByCreatedDescParams(p))
		for _, row := range r2 {
			rows = append(rows, dbsqlc.GetOpenIssuesWithRepoRow(row))
		}
	case "created_asc":
		var r2 []dbsqlc.GetOpenIssuesWithRepoByCreatedAscRow
		r2, err = r.q.GetOpenIssuesWithRepoByCreatedAsc(ctx, dbsqlc.GetOpenIssuesWithRepoByCreatedAscParams(p))
		for _, row := range r2 {
			rows = append(rows, dbsqlc.GetOpenIssuesWithRepoRow(row))
		}
	default: // updated_desc
		rows, err = r.q.GetOpenIssuesWithRepo(ctx, p)
	}
	if err != nil {
		return nil, fmt.Errorf("get open issues with repo: %w", err)
	}
	issues := make([]domain.IssueWithRepo, len(rows))
	for i, row := range rows {
		issue := domain.IssueWithRepo{
			ID:           row.ID,
			Number:       int(row.Number),
			Title:        row.Title,
			URL:          row.Url,
			Labels:       labelsFromJSON(row.Labels.String),
			RepoFullName: row.RepoFullName,
			RepoStars:    int(row.RepoStarsCount.Int64),
		}
		if row.RepoLanguage.Valid {
			issue.RepoLanguage = row.RepoLanguage.String
		}
		if row.CreatedAtGithub.Valid {
			t := row.CreatedAtGithub.Time
			issue.CreatedAt = &t
		}
		if row.UpdatedAtGithub.Valid {
			t := row.UpdatedAtGithub.Time
			issue.UpdatedAt = &t
		}
		if row.RepoLastScannedAt.Valid {
			t := row.RepoLastScannedAt.Time
			issue.RepoLastScannedAt = &t
		}
		issues[i] = issue
	}
	return issues, nil
}

func (r *SQLiteRepo) CountOpenIssuesForUser(ctx context.Context, userID int64) (int, error) {
	count, err := r.q.CountOpenIssuesForUser(ctx, userID)
	if err != nil {
		return 0, fmt.Errorf("count open issues for user: %w", err)
	}
	return int(count), nil
}

// --- Mappers ---

func userFromRow(row dbsqlc.User) *domain.User {
	u := &domain.User{
		ID:             row.ID,
		GithubID:       row.GithubID,
		GithubLogin:    row.GithubLogin,
		EncryptedToken: row.EncryptedToken,
		CreatedAt:      row.CreatedAt,
	}
	if row.LastSyncedAt.Valid {
		t := row.LastSyncedAt.Time
		u.LastSyncedAt = &t
	}
	return u
}

func repoFromRow(row dbsqlc.Repo) domain.Repo {
	r := domain.Repo{
		ID:         row.ID,
		GithubID:   row.GithubID,
		FullName:   row.FullName,
		StarsCount: int(row.StarsCount.Int64),
		CreatedAt:  row.CreatedAt,
	}
	if row.Description.Valid {
		r.Description = row.Description.String
	}
	if row.Language.Valid {
		r.Language = row.Language.String
	}
	if row.Etag.Valid {
		r.ETag = row.Etag.String
	}
	if row.LastScannedAt.Valid {
		t := row.LastScannedAt.Time
		r.LastScannedAt = &t
	}
	return r
}

func issueFromRow(row dbsqlc.Issue) domain.Issue {
	iss := domain.Issue{
		ID:         row.ID,
		GithubID:   row.GithubID,
		RepoID:     row.RepoID,
		Number:     int(row.Number),
		Title:      row.Title,
		URL:        row.Url,
		IsOpen:     row.IsOpen != 0,
		Labels:     labelsFromJSON(row.Labels.String),
		LastSeenAt: row.LastSeenAt,
	}
	if row.CreatedAtGithub.Valid {
		t := row.CreatedAtGithub.Time
		iss.CreatedAtGithub = &t
	}
	if row.UpdatedAtGithub.Valid {
		t := row.UpdatedAtGithub.Time
		iss.UpdatedAtGithub = &t
	}
	return iss
}

// --- Helpers ---

func labelsToJSON(labels []string) string {
	if len(labels) == 0 {
		return "[]"
	}
	b, _ := json.Marshal(labels)
	return string(b)
}

func labelsFromJSON(s string) []string {
	if s == "" {
		return nil
	}
	var out []string
	_ = json.Unmarshal([]byte(s), &out)
	return out
}

func boolToInt(b bool) int64 {
	if b {
		return 1
	}
	return 0
}

// Compile-time interface check.
var _ Repository = (*SQLiteRepo)(nil)

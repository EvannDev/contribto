package scan

import (
	"context"
	"log/slog"
	"time"

	"github.com/EvannDev/contribto/internal/domain"
	"github.com/EvannDev/contribto/internal/github"
	"github.com/EvannDev/contribto/internal/repo"
)

const (
	scanInterval  = 5 * time.Minute
	scanThreshold = 1 * time.Hour
	scanBatchSize = 50
)

// Worker scans starred repos for Good First Issues on a fixed interval.
type Worker struct {
	repo repo.Repository
	gh   *github.Client
	pat  string
}

func NewWorker(r repo.Repository, gh *github.Client, pat string) *Worker {
	return &Worker{repo: r, gh: gh, pat: pat}
}

// Start runs immediately then every scanInterval until ctx is cancelled.
func (w *Worker) Start(ctx context.Context) {
	slog.Info("scan worker started")
	w.runOnce(ctx)

	ticker := time.NewTicker(scanInterval)
	defer ticker.Stop()

	for {
		select {
		case <-ticker.C:
			w.runOnce(ctx)
		case <-ctx.Done():
			slog.Info("scan worker stopped")
			return
		}
	}
}

func (w *Worker) runOnce(ctx context.Context) {
	repos, err := w.repo.GetReposToScan(ctx, time.Now().Add(-scanThreshold), scanBatchSize)
	if err != nil {
		slog.Error("scan: get repos to scan", "err", err)
		return
	}
	if len(repos) == 0 {
		return
	}

	slog.Info("scan batch started", "repos", len(repos))
	for _, r := range repos {
		w.scanRepo(ctx, r)
	}
}

func (w *Worker) scanRepo(ctx context.Context, r domain.Repo) {
	start := time.Now()

	ghIssues, err := w.gh.GetRepoIssues(ctx, w.pat, r.FullName)
	if err != nil {
		slog.Error("scan: fetch issues", "repo", r.FullName, "err", err)
		return
	}

	openIDs := make([]int64, 0, len(ghIssues))
	for _, gi := range ghIssues {
		createdAt := gi.CreatedAt
		updatedAt := gi.UpdatedAt
		issue := &domain.Issue{
			GithubID:        gi.ID,
			RepoID:          r.ID,
			Number:          gi.Number,
			Title:           gi.Title,
			URL:             gi.HTMLURL,
			Labels:          gi.Labels,
			IsOpen:          true,
			CreatedAtGithub: &createdAt,
			UpdatedAtGithub: &updatedAt,
			LastSeenAt:      time.Now(),
		}
		if err := w.repo.UpsertIssue(ctx, issue); err != nil {
			slog.Error("scan: upsert issue", "repo", r.FullName, "issue", gi.Number, "err", err)
			continue
		}
		openIDs = append(openIDs, gi.ID)
	}

	if err := w.repo.MarkIssuesClosed(ctx, r.ID, openIDs); err != nil {
		slog.Error("scan: mark issues closed", "repo", r.FullName, "err", err)
	}

	if err := w.repo.UpdateRepoScanned(ctx, r.ID, "", time.Now()); err != nil {
		slog.Error("scan: update repo scanned", "repo", r.FullName, "err", err)
	}

	slog.Info("scanned", "repo", r.FullName, "issues", len(ghIssues), "duration", time.Since(start).Round(time.Millisecond))
}

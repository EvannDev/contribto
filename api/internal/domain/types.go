package domain

import "time"

type User struct {
	ID             int64
	GithubID       int64
	GithubLogin    string
	EncryptedToken []byte
	CreatedAt      time.Time
	LastSyncedAt   *time.Time
}

type Repo struct {
	ID            int64
	GithubID      int64
	FullName      string
	Description   string
	Language      string
	StarsCount    int
	ETag          string
	LastScannedAt *time.Time
	CreatedAt     time.Time
}

type IssueWithRepo struct {
	ID           int64
	Number       int
	Title        string
	URL          string
	Labels       []string
	CreatedAt    *time.Time
	UpdatedAt    *time.Time
	RepoFullName      string
	RepoLanguage      string
	RepoStars         int
	RepoLastScannedAt *time.Time
}

type Issue struct {
	ID              int64
	GithubID        int64
	RepoID          int64
	Number          int
	Title           string
	URL             string
	Labels          []string
	IsOpen          bool
	CreatedAtGithub *time.Time
	UpdatedAtGithub *time.Time
	LastSeenAt      time.Time
}

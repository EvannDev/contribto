-- +goose Up
-- +goose StatementBegin

CREATE TABLE users (
    id              INTEGER PRIMARY KEY,
    github_id       INTEGER NOT NULL UNIQUE,
    github_login    TEXT NOT NULL,
    encrypted_token BLOB NOT NULL,
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_synced_at  TIMESTAMP
);

CREATE TABLE repos (
    id              INTEGER PRIMARY KEY,
    github_id       INTEGER NOT NULL UNIQUE,
    full_name       TEXT NOT NULL,
    description     TEXT,
    language        TEXT,
    stars_count     INTEGER,
    etag            TEXT,
    last_scanned_at TIMESTAMP,
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_repos_last_scanned ON repos(last_scanned_at);

CREATE TABLE user_stars (
    user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    repo_id    INTEGER NOT NULL REFERENCES repos(id) ON DELETE CASCADE,
    starred_at TIMESTAMP,
    PRIMARY KEY (user_id, repo_id)
);

CREATE TABLE issues (
    id               INTEGER PRIMARY KEY,
    github_id        INTEGER NOT NULL UNIQUE,
    repo_id          INTEGER NOT NULL REFERENCES repos(id) ON DELETE CASCADE,
    number           INTEGER NOT NULL,
    title            TEXT NOT NULL,
    url              TEXT NOT NULL,
    labels           TEXT,
    is_open          INTEGER NOT NULL DEFAULT 1,
    created_at_github TIMESTAMP,
    updated_at_github TIMESTAMP,
    last_seen_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_issues_repo_open ON issues(repo_id, is_open);

-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin

DROP TABLE IF EXISTS issues;
DROP TABLE IF EXISTS user_stars;
DROP TABLE IF EXISTS repos;
DROP TABLE IF EXISTS users;

-- +goose StatementEnd

-- name: UpsertIssue :exec
INSERT INTO issues (github_id, repo_id, number, title, url, labels, is_open,
                    created_at_github, updated_at_github, last_seen_at)
VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
ON CONFLICT(github_id) DO UPDATE SET
    title             = excluded.title,
    labels            = excluded.labels,
    is_open           = excluded.is_open,
    updated_at_github = excluded.updated_at_github,
    last_seen_at      = excluded.last_seen_at;

-- name: MarkIssuesClosed :exec
UPDATE issues
SET is_open = 0
WHERE repo_id = ?
  AND is_open = 1
  AND github_id NOT IN (sqlc.slice('open_github_ids'));

-- name: GetOpenIssuesForUser :many
SELECT i.*
FROM issues i
JOIN repos r ON r.id = i.repo_id
JOIN user_stars us ON us.repo_id = r.id
WHERE us.user_id = ?
  AND i.is_open = 1
ORDER BY i.updated_at_github DESC
LIMIT ?
OFFSET ?;

-- name: CountOpenIssuesForUser :one
SELECT COUNT(*) FROM issues i
JOIN repos r ON r.id = i.repo_id
JOIN user_stars us ON us.repo_id = r.id
WHERE us.user_id = ?
  AND i.is_open = 1;

-- name: GetOpenIssuesWithRepo :many
SELECT
    i.id, i.number, i.title, i.url, i.labels, i.created_at_github, i.updated_at_github,
    r.full_name   AS repo_full_name,
    r.language    AS repo_language,
    r.stars_count     AS repo_stars_count,
    r.last_scanned_at AS repo_last_scanned_at
FROM issues i
JOIN repos r       ON r.id       = i.repo_id
JOIN user_stars us ON us.repo_id = r.id
WHERE us.user_id = ?
  AND i.is_open = 1
ORDER BY i.updated_at_github DESC
LIMIT ?
OFFSET ?;

-- name: GetOpenIssuesWithRepoByUpdatedAsc :many
SELECT
    i.id, i.number, i.title, i.url, i.labels, i.created_at_github, i.updated_at_github,
    r.full_name   AS repo_full_name,
    r.language    AS repo_language,
    r.stars_count     AS repo_stars_count,
    r.last_scanned_at AS repo_last_scanned_at
FROM issues i
JOIN repos r       ON r.id       = i.repo_id
JOIN user_stars us ON us.repo_id = r.id
WHERE us.user_id = ?
  AND i.is_open = 1
ORDER BY i.updated_at_github ASC
LIMIT ?
OFFSET ?;

-- name: GetOpenIssuesWithRepoByCreatedDesc :many
SELECT
    i.id, i.number, i.title, i.url, i.labels, i.created_at_github, i.updated_at_github,
    r.full_name   AS repo_full_name,
    r.language    AS repo_language,
    r.stars_count     AS repo_stars_count,
    r.last_scanned_at AS repo_last_scanned_at
FROM issues i
JOIN repos r       ON r.id       = i.repo_id
JOIN user_stars us ON us.repo_id = r.id
WHERE us.user_id = ?
  AND i.is_open = 1
ORDER BY i.created_at_github DESC
LIMIT ?
OFFSET ?;

-- name: GetOpenIssuesWithRepoByCreatedAsc :many
SELECT
    i.id, i.number, i.title, i.url, i.labels, i.created_at_github, i.updated_at_github,
    r.full_name   AS repo_full_name,
    r.language    AS repo_language,
    r.stars_count     AS repo_stars_count,
    r.last_scanned_at AS repo_last_scanned_at
FROM issues i
JOIN repos r       ON r.id       = i.repo_id
JOIN user_stars us ON us.repo_id = r.id
WHERE us.user_id = ?
  AND i.is_open = 1
ORDER BY i.created_at_github ASC
LIMIT ?
OFFSET ?;

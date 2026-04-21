-- name: UpsertRepo :one
INSERT INTO repos (github_id, full_name, description, language, stars_count)
VALUES (?, ?, ?, ?, ?)
ON CONFLICT(github_id) DO UPDATE SET
    full_name   = excluded.full_name,
    description = excluded.description,
    language    = excluded.language,
    stars_count = excluded.stars_count
RETURNING id;

-- name: GetReposToScan :many
SELECT r.*
FROM repos r
WHERE r.last_scanned_at IS NULL
   OR r.last_scanned_at < ?
ORDER BY (
    SELECT COUNT(*) FROM user_stars us WHERE us.repo_id = r.id
) DESC
LIMIT ?;

-- name: UpdateRepoScanned :exec
UPDATE repos SET etag = ?, last_scanned_at = ? WHERE id = ?;

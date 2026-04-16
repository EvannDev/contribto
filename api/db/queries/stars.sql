-- name: LinkUserToRepo :exec
INSERT INTO user_stars (user_id, repo_id, starred_at)
VALUES (?, ?, ?)
ON CONFLICT(user_id, repo_id) DO NOTHING;

-- name: GetUserStarredRepos :many
SELECT r.*
FROM repos r
JOIN user_stars us ON us.repo_id = r.id
WHERE us.user_id = ?;

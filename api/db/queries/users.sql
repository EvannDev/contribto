-- name: GetUserByID :one
SELECT * FROM users WHERE id = ?;

-- name: GetUserByGithubID :one
SELECT * FROM users WHERE github_id = ?;

-- name: UpsertUser :one
INSERT INTO users (github_id, github_login, encrypted_token)
VALUES (?, ?, ?)
ON CONFLICT(github_id) DO UPDATE SET
    github_login     = excluded.github_login,
    encrypted_token  = excluded.encrypted_token
RETURNING id;

-- name: UpdateUserToken :exec
UPDATE users SET encrypted_token = ? WHERE id = ?;

-- name: UpdateUserSyncedAt :exec
UPDATE users SET last_synced_at = ? WHERE id = ?;

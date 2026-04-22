# Contrib.to

> Find your next open source contribution — surfaced from repos you already care about.

Contrib.to shows you **Good First Issues** from GitHub repositories you've starred. No noise from random projects, just issues from codebases you've already chosen to follow.

---

## How it works

1. Sign in with GitHub
2. Your starred repos are synced automatically
3. A background worker scans those repos for open `good first issue` tickets every hour
4. Your dashboard shows a live feed of issues to pick up

---

## Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js (App Router) — deployed on Vercel |
| API | Go + Fiber v3 — running on Hetzner VPS (~4€/mo) |
| Database | SQLite + Litestream → Cloudflare R2 |
| DB layer | `sqlc` (type-safe SQL, no ORM) |
| Auth | GitHub OAuth (direct, no third-party service) |
| GitHub API | `google/go-github` v72 |
| Reverse proxy | Caddy (auto HTTPS) |

---

## Project structure

```
.
├── api/              # Go backend
│   ├── cmd/
│   │   ├── api/      # Main entrypoint
│   │   └── migrate/  # DB migration runner
│   ├── internal/
│   │   ├── http/     # HTTP handlers & middleware
│   │   ├── github/   # GitHub API client (ETags, pagination)
│   │   ├── scan/     # Background scan worker (goroutine)
│   │   ├── repo/     # Repository interface + SQLite impl
│   │   ├── domain/   # Core types (User, Repo, Issue)
│   │   └── crypto/   # AES-GCM token encryption
│   └── db/
│       ├── migrations/   # Versioned SQL migration files
│       ├── queries/      # sqlc input queries
│       └── sqlc/         # Generated Go code (do not edit)
└── web/              # Next.js frontend
    ├── app/          # Routes and pages (App Router)
    ├── components/   # React components
    └── lib/          # API client helpers
```

---

## Local development

### Prerequisites

- Go 1.25+
- Node.js + pnpm
- A GitHub OAuth App ([create one here](https://github.com/settings/developers))
  - Callback URL: `http://localhost:3000/api/auth/callback/github`
  - Required scopes: `public_repo`, `read:user`
- `sqlc` — `go install github.com/sqlc-dev/sqlc/cmd/sqlc@latest`
- `golangci-lint` (optional, for linting)

### Setup

**1. Clone the repo**

```bash
git clone https://github.com/EvannDev/contribto
cd contribto
```

**2. Configure environment variables**

```bash
# API
cp api/.env.example api/.env
# Fill in: GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET, TOKEN_ENCRYPTION_KEY, DB_PATH

# Frontend
cp web/.env.example web/.env.local
# Fill in: NEXT_PUBLIC_API_URL, GITHUB_CLIENT_ID
```

`TOKEN_ENCRYPTION_KEY` must be a 32-byte hex string (AES-256):
```bash
openssl rand -hex 32
```

**3. Run DB migrations**

```bash
make db-up
```

**4. Start the API**

```bash
make api-run
```

**5. Start the frontend**

```bash
make web-dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Make targets

```
make help           # List all available targets

make api-run        # Run the API (loads api/.env)
make api-build      # Build the API binary → api/bin/api
make api-test       # Run Go tests
make api-lint       # Run golangci-lint
make api-sqlc       # Regenerate sqlc code after editing queries

make db-up          # Apply pending migrations
make db-down        # Roll back the last migration
make db-status      # Show migration status
make db-create name=<name>   # Create a new migration file

make web-dev        # Start the Next.js dev server
make web-build      # Build the Next.js app
make web-lint       # Run ESLint
make web-typecheck  # Run TypeScript type checking

make build          # Alias for api-build
make test           # Alias for api-test
make lint           # Run all linters (Go + TS)
```

---

## Environment variables

### API (`api/.env`)

| Variable | Description |
|---|---|
| `GITHUB_CLIENT_ID` | OAuth App client ID |
| `GITHUB_CLIENT_SECRET` | OAuth App client secret |
| `GITHUB_PAT` | Personal Access Token used by the scan worker |
| `TOKEN_ENCRYPTION_KEY` | 32-byte hex key for AES-GCM encryption of user tokens |
| `DB_PATH` | Path to the SQLite database file |
| `PORT` | HTTP port (default: `8080`) |

### Frontend (`web/.env.local`)

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_API_URL` | Base URL of the Go API |
| `GITHUB_CLIENT_ID` | OAuth App client ID (used for the OAuth redirect URL) |

---

## Security

- **User GitHub tokens** are encrypted at rest using AES-GCM. Even if the database is leaked, tokens are not exploitable.
- **Session cookies** are `HttpOnly`, `Secure`, and `SameSite=Lax`.
- **CORS** is restricted to the Vercel frontend origin.
- **Rate limiting** is applied on endpoints that trigger GitHub API calls.
- No secrets are ever logged — not even truncated.

---

## Architecture decisions

See [ARCHITECTURE.md](ARCHITECTURE.md) for the full reasoning behind every technical choice (SQLite over Postgres, Fiber over stdlib, Litestream for backups, ETags to stretch the GitHub rate limit, etc.).

See [ROADMAP.md](ROADMAP.md) for current status and what's planned next.

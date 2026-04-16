# HelloCommit — Makefile
# Run `make help` to see all available targets.

DB_PATH     ?= ./app.db
GOPATH      := $(shell go env GOPATH)
SQLC        := $(GOPATH)/bin/sqlc
API_BIN     := api/bin/api

.PHONY: help \
        api-build api-run api-test api-lint api-sqlc \
        db-up db-down db-status db-create \
        web-dev web-build web-lint web-typecheck \
        build test lint

# ─── Help ────────────────────────────────────────────────────────────────────

help: ## Show this help message
	@grep -E '^[a-zA-Z_-]+:.*##' $(MAKEFILE_LIST) \
		| awk 'BEGIN {FS = ":.*##"}; {printf "  \033[36m%-18s\033[0m %s\n", $$1, $$2}'

# ─── API ─────────────────────────────────────────────────────────────────────

api-build: ## Build the API binary → api/bin/api
	cd api && go build -o bin/api ./cmd/api

api-run: ## Run the API in dev mode (loads api/.env automatically)
	cd api && set -a && . ./.env && set +a && go run ./cmd/api

api-test: ## Run all Go tests
	cd api && go test ./...

api-lint: ## Run golangci-lint on the API
	cd api && golangci-lint run

api-sqlc: ## Regenerate sqlc code from db/queries/*.sql
	cd api && $(SQLC) generate

# ─── Migrations ──────────────────────────────────────────────────────────────

db-up: ## Apply all pending migrations  (DB_PATH=./app.db)
	cd api && DB_PATH=$(DB_PATH) go run ./cmd/migrate up

db-down: ## Roll back the last migration (DB_PATH=./app.db)
	cd api && DB_PATH=$(DB_PATH) go run ./cmd/migrate down

db-status: ## Show migration status      (DB_PATH=./app.db)
	cd api && DB_PATH=$(DB_PATH) go run ./cmd/migrate status

db-create: ## Create a new migration: make db-create name=<migration_name>
	cd api && go run ./cmd/migrate create $(name)

# ─── Web ─────────────────────────────────────────────────────────────────────

web-dev: ## Start the Next.js dev server
	cd web && pnpm dev

web-build: ## Build the Next.js app for production
	cd web && pnpm build

web-lint: ## Run ESLint on the frontend
	cd web && pnpm lint

web-typecheck: ## Run TypeScript type checking
	cd web && pnpm tsc --noEmit

# ─── Aliases ─────────────────────────────────────────────────────────────────

build: api-build ## Build the API binary

test: api-test ## Run all tests

lint: api-lint web-lint ## Run all linters

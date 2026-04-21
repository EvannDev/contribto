# Contrib.to
---

## Projet

**Contrib.to** — web app qui aide les développeurs à trouver des **Good First Issues** sur GitHub, basées sur les repos qu'ils ont starrés.

**Échelle cible :** <1k users actifs, coût visé ~5€/mo.

Voir `ARCHITECTURE.md` pour le détail des choix techniques et leur justification.

---

## Structure du repo (monorepo)

```
.
├── api/              # Backend Go
│   ├── cmd/          # Points d'entrée (main.go)
│   ├── internal/     # Code applicatif (non importable hors du module)
│   │   ├── http/     # Handlers HTTP, middleware
│   │   ├── github/   # Client GitHub API + ETags
│   │   ├── scan/     # Worker de scan des repos
│   │   ├── repo/     # Interface Repository + impl SQLite
│   │   └── domain/   # Types métier (User, Repo, Issue)
│   ├── db/
│   │   ├── migrations/   # Fichiers .sql versionnés
│   │   ├── queries/      # Fichiers .sql pour sqlc
│   │   └── sqlc/         # Code généré par sqlc (NE PAS éditer)
│   └── sqlc.yaml
├── web/              # Frontend Next.js (App Router)
│   ├── app/          # Routes, layouts, pages
│   ├── components/   # Composants React
│   ├── lib/          # Utilitaires (fetch API, helpers)
│   └── types/        # Types TypeScript partagés
├── ARCHITECTURE.md   # Décisions techniques
├── ROADMAP.md        # Roadmap par phases
└── CLAUDE.md         # Ce fichier
```

---

## Stack

| Composant | Choix |
|---|---|
| Front | Next.js (App Router) sur Vercel |
| API | Go sur VPS Hetzner |
| HTTP framework | Fiber v3 |
| DB | SQLite + Litestream → Cloudflare R2 |
| DB layer | `sqlc` (pas d'ORM) |
| Auth | GitHub OAuth direct |
| GitHub API | `google/go-github` v72 |
| Cache | in-memory (ristretto) |
| Styling | Tailwind |

---

## Commandes utiles

### API (Go)

```bash
cd api

# Lancer en dev (hot reload avec air si installé)
go run ./cmd/api

# Tests
go test ./...
go test -run TestScanWorker ./internal/scan  # un test précis

# Régénérer le code sqlc après modif des queries
sqlc generate

# Lint (golangci-lint)
golangci-lint run

# Build
go build -o bin/api ./cmd/api
```

### Front (Next.js)

```bash
cd web

# Dev
pnpm dev

# Type check
pnpm tsc --noEmit

# Lint
pnpm lint

# Build
pnpm build
```

### Migrations DB

```bash
# Appliquer les migrations
cd api && go run ./cmd/migrate up

# Créer une nouvelle migration
go run ./cmd/migrate create nom_de_la_migration
```

---

## Conventions code

### Go (API)

- **Idiomatique avant tout** : pas de patterns Java/C# plaqués sur Go.
- **Erreurs explicites** : `if err != nil { return ... }`, jamais de panic dans le code métier.
- **Logs structurés** avec `log/slog` (jamais `fmt.Println` ni `log.Printf`).
- **Contexte propagé** partout : `ctx context.Context` en premier paramètre de toute fonction qui fait de l'I/O.
- **`sqlc` pour les requêtes** : SQL dans `db/queries/*.sql`, jamais de SQL inline dans le code métier.
- **Interface `Repository`** : tout accès DB passe par là (mockable, et migration future Postgres).
- **Tests** : table-driven tests pour la logique métier, tests d'intégration pour les endpoints critiques.
- **Pas de globals** sauf `slog.Default()` et constantes.
- **Fiber v3 pour le HTTP** : import `github.com/gofiber/fiber/v3`, handlers via `fiber.Ctx` (interface, plus de pointeur). Ne pas utiliser `net/http` directement dans les handlers.
- **Binding v3** : utiliser `c.Bind().Body(&dto)` / `c.Bind().Query(&dto)` — jamais `c.BodyParser()` (supprimé en v3).
- **Valeurs middleware** : utiliser les helpers dédiés (`httphandler.UserIDFromContext(c)`) — jamais `c.Locals("key")` directement dans les handlers.
- **GitHub API** : utiliser `google/go-github` v72 (`github.com/google/go-github/v72/github`) pour tous les appels à l'API REST GitHub. Créer un client authentifié via `golang.org/x/oauth2` : `gogithub.NewClient(oauth2.NewClient(ctx, oauth2.StaticTokenSource(&oauth2.Token{AccessToken: token})))`. Exception : l'échange OAuth (`/login/oauth/access_token`) reste en `net/http` brut car ce n'est pas un endpoint de la REST API.

Exemples de signatures attendues :
```go
// Service (logique métier — pas de Fiber ici)
func (s *Service) FetchIssues(ctx context.Context, userID int64) ([]domain.Issue, error)

// Handler Fiber v3 (Ctx est une interface, pas un pointeur)
func (h *Handler) GetIssues(c fiber.Ctx) error {
    userID := httphandler.UserIDFromContext(c)
    issues, err := h.svc.FetchIssues(c.Context(), userID)
    if err != nil {
        return err
    }
    return c.JSON(issues)
}
```

### Next.js (Front)

- **App Router uniquement**, pas de Pages Router.
- **Server Components par défaut**, `"use client"` seulement quand nécessaire (interactivité, hooks browser).
- **TypeScript strict**, pas de `any`, pas de `// @ts-ignore` sans commentaire justifiant.
- **Pas de state management lourd** (Redux, Zustand) tant que ce n'est pas justifié — `useState` + Server Components suffisent à notre échelle.
- **Tailwind** pour le styling, pas de CSS Modules ou styled-components.
- **Fetch côté serveur** quand possible (Server Components), pas de useEffect pour fetcher au mount.

### Général

- **YAGNI** : ne pas anticiper des besoins hypothétiques.
- **Pas de dépendances inutiles** : chaque lib ajoutée doit se justifier. Demander avant d'en ajouter une nouvelle.
- **Lisibilité > cleverness** : du code évident vaut mieux que du code malin.
- **Commenter le pourquoi**, pas le quoi.

---

## Choses à NE PAS faire (red flags)

Si une de ces options semble nécessaire, **stop et demande confirmation** avant d'avancer :

- Ajouter Kubernetes, Docker Swarm, ou toute orchestration lourde.
- Découper en microservices.
- Ajouter une queue externe (Kafka, RabbitMQ, NATS) — la DB suffit comme queue à notre échelle.
- Ajouter un ORM lourd (GORM, Ent) — on a `sqlc`.
- Ajouter Redis tant qu'on a une seule instance API.
- Migrer vers Postgres tant qu'on n'a pas de trigger clair (multi-instance, serverless).
- Ajouter GraphQL — REST simple suffit.
- Ajouter un state manager front (Redux, Zustand, Jotai) sans cas d'usage clair.
- Modifier le code généré par `sqlc` (`db/sqlc/`) à la main.
- Remplacer Fiber par `net/http` ou un autre framework sans discussion préalable.
- Utiliser l'API Fiber v2 (`*fiber.Ctx`, `c.BodyParser()`, `c.Locals()` pour les middlewares, `AllowOrigins` string) — on est sur v3.
- Appeler l'API GitHub avec `net/http` brut (sauf `ExchangeCode`) — utiliser `google/go-github` v72.

---

## Workflow attendu

### Avant de coder

1. **Lire `ARCHITECTURE.md`** si la tâche touche à des choix structurants.
2. **Explorer le code existant** avant d'inventer un nouveau pattern : il y a probablement déjà un endroit où ça se fait.
3. **Si la demande est ambiguë** (scope, objectif, contraintes), poser des questions au lieu de deviner.

### Pendant

1. **Petits commits logiques** plutôt qu'un gros patch monolithique.
2. **Lancer les tests et le lint** avant de proposer le code comme terminé.
3. **Toujours préciser le chemin du fichier** au-dessus des blocs de code dans les explications.

### Après

1. **Mettre à jour les tests** quand le comportement change.
2. **Mettre à jour `ARCHITECTURE.md`** si une décision structurante évolue.
3. **Résumer ce qui a été fait** et **ce qui reste à faire** si la tâche est partiellement terminée.

---

## Ton attendu

- **Pédagogue** : explique le **pourquoi** derrière les propositions, pas juste le **quoi**.
- **Direct** : va à l'essentiel, structure quand ça aide, sans en faire trop.
- **Honnête** : si une idée est mauvaise, dis-le et explique pourquoi. Ne valide pas par politesse.
- **Humble** : dis "je ne sais pas" plutôt que d'inventer, surtout pour les versions de libs ou comportements précis d'APIs externes. Suggère de vérifier la doc officielle quand pertinent.

---

## Variables d'environnement

À documenter dans `.env.example` (à la racine de `api/` et `web/`).

**API (`api/.env`) :**
- `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`
- `TOKEN_ENCRYPTION_KEY` (clé AES-256 pour chiffrer les tokens GitHub des users)
- `DB_PATH` (chemin du fichier SQLite)
- `LITESTREAM_*` (config R2)

**Web (`web/.env.local`) :**
- `NEXT_PUBLIC_API_URL`
- `GITHUB_CLIENT_ID` (côté front, pour l'OAuth redirect)

⚠️ **Ne jamais committer de `.env`**, jamais logguer un token GitHub.

---

## Sécurité

- **Tokens GitHub des users** : chiffrés en DB (AES-GCM), jamais en clair dans les logs.
- **Inputs HTTP** : valider strictement (taille, format) avant de les passer à la DB ou GitHub.
- **CORS** : whitelist stricte sur l'origine du front Vercel.
- **Rate limiting** : en place sur les endpoints qui appellent GitHub côté user (refresh manuel notamment).

---

## Roadmap

Voir `ROADMAP.md` pour le détail sur les travaux effectuer.

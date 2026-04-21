# Architecture — Contrib.to

Ce document explique les choix techniques de Contrib.to. Il vise à donner le **pourquoi** derrière chaque décision, pour que les futurs contributeurs (et toi dans 6 mois) puissent les remettre en question en connaissance de cause.

---

## Table des matières

1. [Vue d'ensemble](#vue-densemble)
2. [Stack](#stack)
3. [Modèle de données](#modèle-de-données)
4. [Flux principaux](#flux-principaux)
5. [Choix techniques détaillés](#choix-techniques-détaillés)
6. [Sécurité](#sécurité)
7. [Ce qu'on a choisi de NE PAS faire](#ce-quon-a-explicitement-choisi-de-ne-pas-faire)
8. [Évolutions futures](#évolutions-futures-envisagées)

---

## Vue d'ensemble

Contrib.to aide les développeurs à trouver des **Good First Issues** sur GitHub, en se basant sur les repos qu'ils ont starrés.

```
┌─────────────────┐         ┌──────────────────┐         ┌──────────────────┐
│                 │  HTTPS  │                  │  HTTPS  │                  │
│  Next.js (App)  │────────▶│   Go API         │────────▶│   GitHub API     │
│   Vercel        │         │   Hetzner VPS    │         │                  │
│                 │◀────────│                  │◀────────│                  │
└────────┬────────┘  JSON   └────┬─────────┬───┘         └──────────────────┘
         │                       │         │
         │ OAuth redirect        │         │ replication
         │                       ▼         ▼
         │                  ┌────────┐  ┌──────────────┐
         │                  │ SQLite │  │ Cloudflare R2│
         └─────────────────▶│  + WAL │  │  (backups)   │
                            └────────┘  └──────────────┘
                                ▲
                                │
                            ┌───┴────────────┐
                            │ Scan worker    │
                            │ (goroutine)    │
                            └────────────────┘
```

**Composants :**
- **Next.js (Vercel)** : front, OAuth flow, SSR de la liste des issues.
- **Go API (Hetzner)** : auth, endpoints REST, worker de scan en goroutine.
- **SQLite + Litestream** : DB locale au VPS, répliquée en continu vers R2.
- **GitHub API** : source unique de vérité pour les stars et les issues.

---

## Stack

| Composant | Choix | Alternatives envisagées |
|---|---|---|
| Front | Next.js (App Router) sur Vercel | SvelteKit, Remix |
| API | Go sur VPS Hetzner | Node.js, Rust |
| HTTP framework | `fiber` (v3) | `net/http` stdlib, Echo, Chi |
| DB | SQLite + Litestream | Postgres (Neon, Supabase) |
| DB layer | `sqlc` | GORM, Ent, sqlx |
| Backups | Cloudflare R2 | S3, Backblaze B2 |
| Auth | GitHub OAuth direct | Clerk, Auth.js |
| Cache | `ristretto` (in-memory) | Redis |
| Reverse proxy | Caddy | Nginx, Traefik |

---

## Modèle de données

### Schéma

```
┌─────────────┐       ┌──────────────┐       ┌─────────────┐
│   users     │       │  user_stars  │       │   repos     │
├─────────────┤       ├──────────────┤       ├─────────────┤
│ id          │◀─────▶│ user_id      │       │ id          │
│ github_id   │       │ repo_id      │◀─────▶│ github_id   │
│ github_login│       │ starred_at   │       │ full_name   │
│ enc_token   │       └──────────────┘       │ language    │
│ last_synced │                              │ stars_count │
└─────────────┘                              │ etag        │
                                             │ last_scanned│
                                             └──────┬──────┘
                                                    │
                                                    ▼
                                             ┌─────────────┐
                                             │   issues    │
                                             ├─────────────┤
                                             │ id          │
                                             │ github_id   │
                                             │ repo_id     │
                                             │ title       │
                                             │ url         │
                                             │ labels      │
                                             │ is_open     │
                                             │ updated_at  │
                                             └─────────────┘
```

### Décision clé : repos partagés entre users

**Le truc important :** la table `repos` est **globale**, pas par-user.

**Pourquoi :** si 100 users starrent `facebook/react`, on scanne ce repo **une seule fois par heure**, pas 100 fois. Économie massive du rate limit GitHub.

**Conséquence positive :** un repo populaire bénéficie à tous les users (issues toujours fraîches), un repo obscur peut attendre un peu plus longtemps entre deux scans.

---

## Flux principaux

### 1. Login / Sync initial des stars

```
User              Next.js              Go API              GitHub
 │                   │                    │                  │
 │ Click "Sign in"   │                    │                  │
 │──────────────────▶│                    │                  │
 │                   │  Redirect to       │                  │
 │                   │  github.com/login  │                  │
 │◀──────────────────│                    │                  │
 │                                        │                  │
 │ Authorize app                          │                  │
 │──────────────────────────────────────────────────────────▶│
 │                                                           │
 │ Redirect with ?code=...                                   │
 │◀──────────────────────────────────────────────────────────│
 │                                                           │
 │ GET /callback?code=                                       │
 │──────────────────▶│                                       │
 │                   │ POST /auth/github                     │
 │                   │  { code }                             │
 │                   │───────────────────▶│                  │
 │                   │                    │ Exchange code    │
 │                   │                    │─────────────────▶│
 │                   │                    │ access_token     │
 │                   │                    │◀─────────────────│
 │                   │                    │ GET /user        │
 │                   │                    │─────────────────▶│
 │                   │                    │ Encrypt token    │
 │                   │                    │ Upsert user      │
 │                   │ Set session cookie │                  │
 │                   │◀───────────────────│                  │
 │                   │                                       │
 │                   │ POST /sync-stars (background)         │
 │                   │───────────────────▶│ GET /user/starred│
 │                   │                    │─────────────────▶│
 │                   │                    │ Upsert repos     │
 │                   │                    │ Insert links     │
 │ Redirect /dash    │                                       │
 │◀──────────────────│                                       │
```

### 2. Worker de scan (background)

```
Toutes les 5 min :
  1. SELECT * FROM repos
     WHERE last_scanned_at IS NULL
        OR last_scanned_at < datetime('now', '-1 hour')
     ORDER BY (SELECT COUNT(*) FROM user_stars WHERE repo_id = repos.id) DESC
     LIMIT 50

  2. Pour chaque repo :
     - GET /repos/{full_name}/issues?labels=good first issue&state=open
       avec If-None-Match: <etag stocké>
     - Si 304 : skip (rien n'a changé)
     - Si 200 : upsert issues, update etag, marquer les disparues comme closed
     - UPDATE repos SET last_scanned_at = NOW(), etag = ?

  3. Sleep 5 min, recommencer.
```

**Pourquoi prioriser par nombre de stars :** un repo populaire = beaucoup de users qui l'attendent. On le scanne en premier.

### 3. Affichage des issues (lecture)

```
User → Next.js (Server Component) → Go API → SQLite
                                       ↓
                                   ristretto cache
                                   (TTL 1 min)
```

Server Component fetch côté serveur Vercel, zéro JS client pour la liste.

---

## Choix techniques détaillés

### 1. Next.js + Go (séparés) plutôt que tout-en-un

**Pourquoi :**
- Next.js est excellent pour le front (SSR, routing, DX) mais moins adapté aux workers de fond longue durée.
- Go gère naturellement la concurrence (goroutines) — parfait pour un worker qui scanne des centaines de repos en parallèle.
- Séparer les deux permet de scaler chaque partie indépendamment plus tard.

**Compromis accepté :** deux runtimes à maintenir, deux déploiements.

**Quand on regrouperait :** si l'API devenait triviale (juste du CRUD synchrone), on pourrait tout mettre en API routes Next.js. Mais le worker de scan justifie largement Go séparé.

---

### 2. SQLite plutôt que Postgres dès le début

**Pourquoi :**
- À <1k users, SQLite en local est **plus rapide** qu'une DB managée (~0.1ms vs ~5-20ms de latence réseau).
- Coût : zéro vs minimum 0-25€/mo pour une DB managée fiable.
- Un seul fichier, backup trivial avec Litestream.
- Le workload est idéal pour SQLite : beaucoup de lectures, écritures concentrées dans un unique worker (zéro contention en mode WAL).

**Configuration SQLite recommandée au démarrage :**

```go
// api/internal/repo/sqlite.go
db, err := sql.Open("sqlite", path)
if err != nil { return nil, err }

pragmas := []string{
    "PRAGMA journal_mode = WAL;",       // writers ne bloquent pas readers
    "PRAGMA synchronous = NORMAL;",     // bon compromis durabilité/perf
    "PRAGMA busy_timeout = 5000;",      // attendre 5s avant SQLITE_BUSY
    "PRAGMA foreign_keys = ON;",        // OFF par défaut (legacy)
    "PRAGMA temp_store = MEMORY;",
    "PRAGMA cache_size = -20000;",      // 20 MB de cache
}
for _, p := range pragmas {
    if _, err := db.Exec(p); err != nil { return nil, err }
}
```

**Quand on migrera :**
- Si on doit faire tourner plusieurs instances de l'API (writes concurrents).
- Si on passe en serverless (Vercel Functions, Cloud Run).
- Si la DB dépasse ~10 GB ou si les requêtes deviennent lentes.

**Cible de migration :** Neon (Postgres serverless, free tier généreux, branching).

---

### 3. Litestream vers Cloudflare R2

**Pourquoi :**
- Réplication continue de SQLite vers du stockage objet : si le VPS crame, on restore en quelques minutes.
- R2 = zéro frais d'egress (vs S3), free tier de 10 GB largement suffisant.
- Solution éprouvée, zéro overhead opérationnel.

**Config minimale (`/etc/litestream.yml`) :**

```yaml
dbs:
  - path: /var/lib/contribto/app.db
    replicas:
      - type: s3
        bucket: contribto-backups
        path: db
        endpoint: https://<account-id>.r2.cloudflarestorage.com
        region: auto
        access-key-id: ${R2_ACCESS_KEY}
        secret-access-key: ${R2_SECRET_KEY}
        retention: 168h     # 7 jours d'historique
        snapshot-interval: 24h
```

**Tester la restauration régulièrement** : un backup non testé n'est pas un backup.

---

### 4. `sqlc` plutôt qu'un ORM

**Pourquoi pas GORM/Ent :**
- Cachent ce qui se passe réellement (génèrent parfois des requêtes inefficaces, N+1).
- API verbeuse en Go, peu idiomatique.
- Le coût d'apprentissage de leur DSL est aussi élevé que celui du SQL.

**Pourquoi `sqlc` :** tu écris du SQL, il génère du Go typé.

```sql
-- db/queries/issues.sql
-- name: GetOpenIssuesForUser :many
SELECT i.*, r.full_name AS repo_full_name, r.language AS repo_language
FROM issues i
JOIN repos r ON r.id = i.repo_id
JOIN user_stars us ON us.repo_id = r.id
WHERE us.user_id = ?
  AND i.is_open = 1
ORDER BY i.updated_at_github DESC
LIMIT ?;
```

Génère automatiquement :

```go
// db/sqlc/issues.sql.go (généré, ne pas éditer)
func (q *Queries) GetOpenIssuesForUser(ctx context.Context, arg GetOpenIssuesForUserParams) ([]GetOpenIssuesForUserRow, error)
```

Tu as la sécurité de typage d'un ORM, sans en avoir les défauts.

---

### 5. Interface `Repository` au-dessus de `sqlc`

**Pourquoi cette couche :** le code généré par `sqlc` est lié à SQLite. Une interface permet de :
- Mocker la DB dans les tests unitaires.
- Migrer SQLite → Postgres en changeant juste l'implémentation.
- Composer plusieurs sources (cache + DB) derrière la même interface.

```go
// api/internal/repo/repository.go
type Repository interface {
    GetUserByGithubID(ctx context.Context, githubID int64) (*domain.User, error)
    UpsertUser(ctx context.Context, u *domain.User) error
    UpsertRepo(ctx context.Context, r *domain.Repo) error
    GetReposToScan(ctx context.Context, olderThan time.Time, limit int) ([]domain.Repo, error)
    GetOpenIssuesForUser(ctx context.Context, userID int64, limit int) ([]domain.Issue, error)
    // ...
}
```

**Implémentation SQLite :**

```go
// api/internal/repo/sqlite.go
type SQLiteRepo struct {
    q *sqlc.Queries
}

func (r *SQLiteRepo) GetOpenIssuesForUser(ctx context.Context, userID int64, limit int) ([]domain.Issue, error) {
    rows, err := r.q.GetOpenIssuesForUser(ctx, sqlc.GetOpenIssuesForUserParams{
        UserID: userID,
        Limit:  int64(limit),
    })
    if err != nil { return nil, err }
    return mapIssuesFromSQLC(rows), nil
}
```

Le code métier ne dépend que de `Repository`, jamais de `sqlc.Queries`.

---

### 6. ETags + conditional requests sur l'API GitHub

**Pourquoi :**
- GitHub renvoie `304 Not Modified` quand rien n'a changé — et **ces requêtes ne comptent PAS dans le rate limit**.
- La majorité des repos ne change pas d'une heure à l'autre → on multiplie le rate limit effectif par 10x ou plus.

**Implémentation :**

```go
// api/internal/github/client.go
func (c *Client) FetchIssues(ctx context.Context, fullName, etag string) (issues []Issue, newEtag string, notModified bool, err error) {
    req, _ := http.NewRequestWithContext(ctx, "GET",
        fmt.Sprintf("https://api.github.com/repos/%s/issues?labels=good first issue&state=open", fullName), nil)
    req.Header.Set("Authorization", "Bearer "+c.token)
    req.Header.Set("Accept", "application/vnd.github+json")
    if etag != "" {
        req.Header.Set("If-None-Match", etag)
    }

    resp, err := c.http.Do(req)
    if err != nil { return nil, "", false, err }
    defer resp.Body.Close()

    if resp.StatusCode == http.StatusNotModified {
        return nil, etag, true, nil
    }
    // ... décoder le JSON, retourner le nouvel ETag
    return issues, resp.Header.Get("ETag"), false, nil
}
```

---

### 7. Worker de scan en goroutine, dans le même process que l'API

**Pourquoi (pour l'instant) :**
- Simplicité : un seul binaire Go à déployer.
- À <1k users, un worker suffit largement.
- Communication via la DB : pas besoin de queue/broker.

**Squelette :**

```go
// api/internal/scan/worker.go
type Worker struct {
    repo   repo.Repository
    gh     *github.Client
    log    *slog.Logger
}

func (w *Worker) Start(ctx context.Context) {
    ticker := time.NewTicker(5 * time.Minute)
    defer ticker.Stop()

    // Tick immédiat au démarrage
    w.runOnce(ctx)
    for {
        select {
        case <-ctx.Done():
            return
        case <-ticker.C:
            w.runOnce(ctx)
        }
    }
}

func (w *Worker) runOnce(ctx context.Context) {
    repos, err := w.repo.GetReposToScan(ctx, time.Now().Add(-1*time.Hour), 50)
    if err != nil {
        w.log.Error("get repos to scan", "err", err)
        return
    }
    for _, r := range repos {
        if err := w.scanRepo(ctx, r); err != nil {
            w.log.Warn("scan repo failed", "repo", r.FullName, "err", err)
        }
    }
}
```

**Quand on séparera :** quand le scan ralentit l'API (CPU/IO), ou quand on veut scaler les workers indépendamment.

---

### 8. Cache in-memory (`ristretto`) plutôt que Redis

**Pourquoi :**
- À notre échelle, un cache local Go suffit. Pas besoin d'un service externe.
- Invalidation simple : le worker de scan invalide les clés concernées après update.
- Économise un service à opérer et ~5€/mo de Redis managé.

**Exemple :**

```go
cache, _ := ristretto.NewCache(&ristretto.Config{
    NumCounters: 1e6,       // 1M de counters de fréquence
    MaxCost:     100 << 20, // 100 MB max
    BufferItems: 64,
})

// Lecture
key := fmt.Sprintf("issues:user:%d", userID)
if v, ok := cache.Get(key); ok {
    return v.([]domain.Issue), nil
}

// Miss → DB
issues, err := repo.GetOpenIssuesForUser(ctx, userID, 50)
if err != nil { return nil, err }
cache.SetWithTTL(key, issues, 1, 60*time.Second)
```

**Quand on passera à Redis :** quand on aura plusieurs instances API qui doivent partager du cache.

---

### 9. Hosting : Vercel (front) + Hetzner (API)

**Pourquoi cette répartition :**
- **Vercel pour Next.js :** free tier excellent, CDN inclus, déploiements en `git push`. Le front est stateless, c'est leur sweet spot.
- **Hetzner pour l'API :** un VPS CX22 (~4€/mo, 2 vCPU, 4 GB RAM) tient des dizaines de milliers de users avec du Go.

**Coût total visé : ~5€/mo** jusqu'à ~5k users actifs.

**Service systemd type :**

```ini
# /etc/systemd/system/contribto.service
[Unit]
Description=Contrib.to API
After=network.target

[Service]
User=contribto
WorkingDirectory=/var/lib/contribto
ExecStart=/usr/local/bin/contribto
EnvironmentFile=/etc/contribto/env
Restart=on-failure
RestartSec=5s

[Install]
WantedBy=multi-user.target
```

Caddy en reverse proxy avec HTTPS auto :

```
api.contrib.to {
    reverse_proxy localhost:8080
}
```

---

### 10. HTTP framework : Fiber (v3)

**Import :** `github.com/gofiber/fiber/v3`

**Pourquoi Fiber plutôt que `net/http` stdlib :**
- **Routing expressif** : groupes de routes, paramètres, middlewares par groupe — bien plus lisible que le mux stdlib pour une API REST.
- **Middlewares prêts à l'emploi** : CORS, rate limiter, logger, recover — pas besoin de les récrire.
- **API familière** : inspirée d'Express, très peu de boilerplate pour déclarer des routes et lire les paramètres.
- **Performances** : basé sur `fasthttp`, légèrement plus rapide que `net/http` sur les benchmarks — sans importance à notre échelle, mais sans coût non plus.

**Pourquoi pas Echo ou Chi :**
- Echo : bon aussi, mais API un peu plus verbeuse.
- Chi : excellent pour du routing stdlib-compatible, mais ne fournit pas les middlewares packagés dont on a besoin (CORS, rate limit).

**Points clés de v3 (breaking changes vs v2) :**
- Handler signature : `func(c fiber.Ctx) error` — plus de pointeur (`*fiber.Ctx`), `Ctx` est maintenant une interface.
- Binding : `c.Bind().Body(&dto)`, `c.Bind().Query(&dto)` remplacent `c.BodyParser()`, `c.QueryParser()`.
- Locals middleware : `session.FromContext(c)`, `requestid.FromContext(c)` — plus de `c.Locals("key")` pour les valeurs middleware.
- Redirects : `c.Redirect().To("/url")` remplace `c.Redirect("/url")`.
- CORS : `AllowOrigins` est maintenant un `[]string`.
- `app.Mount()` supprimé — utiliser `app.Use()` pour monter des sous-apps.
- Requiert Go 1.25+.

**Structure des routes :**

```go
// api/cmd/api/main.go
app := fiber.New(fiber.Config{
    ErrorHandler: customErrorHandler,
})

// Middlewares globaux
app.Use(logger.New())
app.Use(recover.New())
app.Use(cors.New(cors.Config{
    AllowOrigins:     []string{"https://contrib.to"},
    AllowCredentials: true,
}))

// Routes publiques
app.Post("/auth/github", handlers.AuthGitHub)

// Routes protégées
api := app.Group("/", middleware.RequireAuth)
api.Post("/sync-stars", handlers.SyncStars)
api.Get("/issues", handlers.GetIssues)

app.Listen(":8080")
```

**Sessions :** cookie httpOnly signé via `gorilla/securecookie`, pas de JWT. Fiber lit/écrit le cookie via `c.Cookie()` / `c.Cookies()`.

**Pourquoi pas de JWT :** overkill ici, et la révocation est difficile. Un cookie signé stateless suffit pour du monolithe single-instance.

---

### 11. Auth : GitHub OAuth direct, pas de service tiers

**Pourquoi :**
- L'app NÉCESSITE GitHub OAuth de toute façon (pour lire les stars). Ajouter Clerk/Auth.js serait redondant.
- Token GitHub stocké chiffré côté Go (AES-GCM avec une clé en variable d'env).
- Pas de mots de passe à gérer = surface d'attaque réduite.

---

## Sécurité

### Chiffrement des tokens GitHub

Les tokens sont chiffrés en DB avec AES-GCM. La clé (`TOKEN_ENCRYPTION_KEY`, 32 bytes) est en variable d'environnement.

```go
// api/internal/crypto/aesgcm.go
func Encrypt(key, plaintext []byte) ([]byte, error) {
    block, err := aes.NewCipher(key)
    if err != nil { return nil, err }
    gcm, err := cipher.NewGCM(block)
    if err != nil { return nil, err }
    nonce := make([]byte, gcm.NonceSize())
    if _, err := rand.Read(nonce); err != nil { return nil, err }
    return gcm.Seal(nonce, nonce, plaintext, nil), nil
}
```

**Pourquoi :** si la DB fuite (backup volé, etc.), les tokens GitHub des users ne sont pas exploitables.

### Autres règles

- **Cookies de session** : `HttpOnly`, `Secure`, `SameSite=Lax`.
- **CORS** : whitelist stricte sur l'origine du front Vercel.
- **Rate limiting** : sur les endpoints qui appellent GitHub côté user (refresh manuel notamment), via `golang.org/x/time/rate`.
- **Inputs HTTP** : valider strictement (taille, format) avant de les passer à la DB ou GitHub.
- **Logs** : ne JAMAIS logger un token, même tronqué. `slog` avec convention : on log les `user_id`, jamais les credentials.

---

## Ce qu'on a explicitement choisi de NE PAS faire

- **Pas de Kubernetes** : un VPS suffit, K8s est une perte de temps à cette échelle.
- **Pas de microservices** : un monolithe Go bien structuré est plus maintenable.
- **Pas de Kafka/RabbitMQ** : la DB sert de queue (table `scan_jobs` si nécessaire un jour).
- **Pas d'ORM lourd** : `sqlc` suffit, on garde le SQL lisible.
- **Pas de GraphQL** : REST simple, l'API est interne au front.
- **Pas de Redis** tant qu'on a une seule instance API.
- **Pas de state manager front** (Redux, Zustand) tant que `useState` + Server Components suffisent.

---

## Évolutions futures envisagées

| Trigger | Action |
|---|---|
| >10k users actifs | Worker de scan sur process séparé (toujours même VPS) |
| Plusieurs instances API nécessaires | Migration Postgres (Neon) + Redis pour le cache partagé |
| Latence front trop élevée hors EU | CDN Cloudflare devant l'API |
| Besoin de notifications temps réel | SSE depuis l'API Go, ou Pusher |
| Recherche avancée sur les issues | Index Meilisearch ou Typesense |
| Volume de scans dépassant un PAT | OAuth App credentials (5000 req/h par installation) |

---

## Décisions à revisiter régulièrement

- **Stockage du token GitHub** : envisager Vault ou un KMS si l'app prend de l'ampleur.
- **Refresh des stars** : actuellement à la demande, pourrait devenir périodique (webhook GitHub `star` event ?).
- **Politique de rétention des issues fermées** : à définir (garder 30 jours ? archiver ?).
- **Métriques** : si on dépasse "ça marche ou pas", brancher Prometheus + Grafana Cloud free tier.
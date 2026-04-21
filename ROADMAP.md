# Contrib.to — Roadmap MVP

Roadmap détaillée pour livrer un MVP fonctionnel utilisable par 10 beta testers.

**Objectif MVP :** un user se connecte avec GitHub, voit la liste des Good First Issues issues de ses repos starrés, peut cliquer pour aller sur GitHub.

**Durée estimée :** 2 semaines à temps partiel, ~1 semaine à temps plein.

**Hors scope du MVP** (volontairement) : filtres avancés, notifications, scoring sophistiqué, refresh manuel, UI léchée. On vise la **boucle complète** d'abord.

---

## Étape 0 — Setup (½ journée)

**Objectif :** avoir un repo prêt à coder.

- [ ] Créer le repo monorepo avec la structure `api/` et `web/`
- [ ] Initialiser le module Go (`go mod init`) et le projet Next.js (`pnpm create next-app`)
- [ ] Ajouter `CLAUDE.md`, `ARCHITECTURE.md`, `ROADMAP.md`, `.gitignore`
- [ ] Créer une **OAuth App GitHub** (Settings → Developer settings → OAuth Apps)
  - Callback URL : `http://localhost:3000/api/auth/callback/github`
  - Récupérer `Client ID` et `Client Secret`
- [ ] Mettre en place les `.env.example` côté API et front

**Pourquoi en premier :** sans l'OAuth App GitHub, rien ne tourne. Autant la créer tout de suite.

---

## Étape 1 — Schéma DB et migrations (½ journée)

**Objectif :** avoir la base de données prête à recevoir des données.

- [ ] Choisir un outil de migrations Go : `goose` ou `golang-migrate` (les deux sont bien, `goose` un peu plus simple)
- [ ] Écrire la migration initiale `001_initial_schema.sql` :

```sql
CREATE TABLE users (
    id INTEGER PRIMARY KEY,
    github_id INTEGER NOT NULL UNIQUE,
    github_login TEXT NOT NULL,
    encrypted_token BLOB NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_synced_at TIMESTAMP
);

CREATE TABLE repos (
    id INTEGER PRIMARY KEY,
    github_id INTEGER NOT NULL UNIQUE,
    full_name TEXT NOT NULL,         -- "owner/repo"
    description TEXT,
    language TEXT,
    stars_count INTEGER,
    etag TEXT,                       -- pour les conditional requests
    last_scanned_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_repos_last_scanned ON repos(last_scanned_at);

CREATE TABLE user_stars (
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    repo_id INTEGER NOT NULL REFERENCES repos(id) ON DELETE CASCADE,
    starred_at TIMESTAMP,
    PRIMARY KEY (user_id, repo_id)
);

CREATE TABLE issues (
    id INTEGER PRIMARY KEY,
    github_id INTEGER NOT NULL UNIQUE,
    repo_id INTEGER NOT NULL REFERENCES repos(id) ON DELETE CASCADE,
    number INTEGER NOT NULL,
    title TEXT NOT NULL,
    url TEXT NOT NULL,
    labels TEXT,                     -- JSON array
    is_open INTEGER NOT NULL DEFAULT 1,
    created_at_github TIMESTAMP,
    updated_at_github TIMESTAMP,
    last_seen_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_issues_repo_open ON issues(repo_id, is_open);
```

- [ ] Activer le mode WAL : `PRAGMA journal_mode=WAL;` au démarrage de l'API
- [ ] Tester que les migrations passent (`go run ./cmd/migrate up`)

**Pourquoi ce schéma :** les `repos` sont globaux (pas dupliqués par user) — c'est la clé pour économiser le rate limit GitHub. Le champ `etag` sur `repos` prépare les conditional requests dès maintenant.

---

## Étape 2 — sqlc et interface Repository (½ journée)

**Objectif :** une couche d'accès DB typée et mockable.

- [ ] Installer `sqlc` (`brew install sqlc` ou binaire)
- [ ] Créer `api/sqlc.yaml` :

```yaml
version: "2"
sql:
  - engine: "sqlite"
    queries: "db/queries"
    schema: "db/migrations"
    gen:
      go:
        package: "sqlc"
        out: "db/sqlc"
        emit_interface: true
```

- [ ] Écrire les premières queries dans `db/queries/users.sql`, `repos.sql`, `issues.sql`
  - `GetUserByGithubID`, `CreateUser`, `UpdateUserToken`
  - `UpsertRepo`, `GetReposToScan` (où `last_scanned_at < ?`)
  - `LinkUserToRepo`, `GetUserStarredRepos`
  - `UpsertIssue`, `MarkIssuesClosed`, `GetOpenIssuesForUser`
- [ ] `sqlc generate` pour générer le code
- [ ] Définir l'interface `Repository` dans `api/internal/repo/repository.go` qui wrappe les méthodes générées

**Pourquoi cette interface au-dessus de `sqlc` :** le code généré est lié à SQLite. L'interface permet de mock pour les tests, et de switcher Postgres plus tard sans toucher au code métier.

---

## Étape 3 — OAuth GitHub (1 journée)

**Objectif :** un user peut se connecter avec son compte GitHub.

- [ ] Côté **Next.js** : page de login avec un bouton "Sign in with GitHub" qui redirige vers `https://github.com/login/oauth/authorize?client_id=...&scope=public_repo,read:user`
- [ ] Route `/api/auth/callback/github` côté Next.js qui :
  1. Récupère le `code` de query string
  2. L'envoie à l'API Go (`POST /auth/github`)
  3. Reçoit un cookie de session (httpOnly, secure)
  4. Redirige vers `/dashboard`
- [ ] Côté **Go** : handler `POST /auth/github` qui :
  1. Échange le `code` contre un access token GitHub
  2. Récupère les infos user (`GET /user`)
  3. Chiffre le token (AES-GCM avec `TOKEN_ENCRYPTION_KEY`)
  4. Upsert le user en DB
  5. Crée une session (cookie signé, ou JWT court — au choix)
- [ ] Middleware Go d'auth qui valide la session sur les endpoints protégés

**Pourquoi chiffrer le token en DB :** si la DB fuite (backup volé, etc.), les tokens GitHub des users ne sont pas exploitables. Standard de sécurité minimal.

**Choix à faire :** session cookie signé (simple, stateless) vs JWT (overkill ici). Je recommande **cookie signé** pour le MVP, géré par `gorilla/sessions` ou `securecookie`.

---

## Étape 4 — Sync des stars (½ journée)

**Objectif :** au login, on récupère la liste des repos starrés par le user.

- [ ] Client GitHub minimal en Go (`api/internal/github/client.go`) avec `net/http` + un wrapper qui ajoute le token bearer
- [ ] Fonction `FetchStarredRepos(ctx, token) ([]Repo, error)` qui paginate sur `GET /user/starred?per_page=100`
- [ ] Endpoint `POST /sync-stars` qui :
  1. Récupère le user de la session
  2. Déchiffre son token
  3. Fetch ses stars
  4. Upsert chaque repo dans `repos`
  5. Insert les liens dans `user_stars`
  6. Update `users.last_synced_at`
- [ ] Appeler ce endpoint automatiquement après le premier login

**Limite à connaître :** un user avec 1000 stars = 10 requêtes GitHub. Reste largement dans le rate limit (5000/h par token).

**Pas dans le MVP :** la détection des unstars (si un user dé-star un repo, on garde le lien). À ajouter plus tard.

---

## Étape 5 — Worker de scan basique (1 journée)

**Objectif :** un worker en background qui scanne les repos pour récupérer leurs Good First Issues.

- [ ] Goroutine lancée au démarrage de l'API (`api/internal/scan/worker.go`)
- [ ] Boucle toutes les 5 minutes :
  1. `SELECT * FROM repos WHERE last_scanned_at IS NULL OR last_scanned_at < datetime('now', '-1 hour') LIMIT 50`
  2. Pour chaque repo : appeler `GET /repos/{owner}/{name}/issues?labels=good first issue&state=open`
  3. Upsert les issues
  4. Marquer comme `is_open = 0` les issues qu'on avait avant et qui ne sont plus dans la réponse
  5. Update `last_scanned_at`
- [ ] Utiliser un **app-level token GitHub** (Personal Access Token au début) pour le worker, pas les tokens des users
- [ ] Logger chaque scan avec `slog` : repo, nombre d'issues trouvées, durée

**Labels à matcher (configurables) :** `good first issue`, `good-first-issue`, `beginner`, `easy`. Hardcodé dans une constante pour le MVP, configurable plus tard.

**Pas dans le MVP :** ETags (Phase 2), backoff exponentiel sophistiqué, parallélisation. Pour 50 repos toutes les 5 min, du séquentiel suffit.

**Pourquoi un PAT et pas les tokens users :** simple à mettre en place, et les tokens users sont précieux (rate limit perso). Pour 100 repos/h, un seul PAT suffit largement.

---

## Étape 6 — Endpoint GET /issues (¼ journée)

**Objectif :** le front peut récupérer les issues à afficher.

- [ ] Endpoint `GET /issues` (auth requise) qui retourne les open issues des repos starrés par le user, joinées avec les infos repo
- [ ] Pagination simple : `?limit=50&offset=0`
- [ ] Tri par défaut : `updated_at_github DESC` (les plus récentes d'abord)
- [ ] Format JSON :

```json
{
  "issues": [
    {
      "id": 123,
      "title": "Add dark mode",
      "url": "https://github.com/owner/repo/issues/42",
      "repo": { "full_name": "owner/repo", "language": "Go", "stars": 1234 },
      "labels": ["good first issue", "help wanted"],
      "updated_at": "2026-04-10T12:00:00Z"
    }
  ],
  "total": 87
}
```

---

## Étape 7 — UI Next.js minimale (1 journée)

**Objectif :** l'user voit ses issues et peut cliquer.

- [ ] Layout de base avec Tailwind, header avec le nom GitHub du user et un bouton "Sign out"
- [ ] Page `/` : landing avec le bouton "Sign in with GitHub" si non connecté, sinon redirect vers `/dashboard`
- [ ] Page `/dashboard` (Server Component) : fetch `/issues` côté serveur, affiche la liste
- [ ] Composant `IssueCard` : titre, repo, labels, langage, lien externe vers GitHub
- [ ] État vide : "Tes repos sont en cours de scan, reviens dans quelques minutes ☕"
- [ ] État de loading : skeleton basique

**Pourquoi Server Component :** zéro JS côté client pour la liste, plus rapide et plus simple. Le seul Client Component nécessaire est le bouton de sign-in/out.

**Pas dans le MVP :** filtres, recherche, pagination UI (juste afficher les 50 premières). YAGNI.

---

## Étape 8 — Déploiement (1 journée)

**Objectif :** c'est en ligne et 10 beta testers peuvent l'utiliser.

- [ ] **API** : provisionner un VPS Hetzner CX22 (~4€/mo)
  - Installer Go, créer un user dédié `contribto`
  - Build le binaire, copier via `scp`
  - Service `systemd` pour le lancer + restart auto
  - Caddy ou Nginx en reverse proxy avec HTTPS auto (Caddy plus simple)
- [ ] **Front** : connecter le repo à Vercel, configurer les env vars
- [ ] **DNS** : domaine pointant vers Vercel (front) et un sous-domaine `api.contrib.to` vers le VPS
- [ ] **Litestream** : config pour répliquer la DB vers Cloudflare R2 (créer un bucket R2 gratuit)
- [ ] Mettre à jour la callback URL de l'OAuth App GitHub pour la prod
- [ ] Test bout en bout : login → sync → attendre le scan → voir les issues

**Pourquoi Caddy plutôt que Nginx :** HTTPS auto via Let's Encrypt en 2 lignes de config. Pour un projet à cette échelle, Nginx est sur-dimensionné en complexité.

---

## Critères de "MVP terminé"

Un MVP est livrable quand **toutes** ces conditions sont remplies :

- [ ] Un nouveau user peut se connecter avec GitHub en moins de 30 secondes
- [ ] Ses repos starrés sont sync sans erreur
- [ ] Il voit au moins quelques GFI dans son dashboard sous 1 heure
- [ ] L'app est accessible en HTTPS sur un domaine propre
- [ ] La DB est répliquée vers R2 (vérifié en restaurant un backup en local)
- [ ] Logs structurés actifs en prod, vérifiables via `journalctl -u contribto`
- [ ] Pas de secrets dans le repo, pas de token loggé

---

## Ce qu'on fait JUSTE APRÈS le MVP (Phase 2)

Dès que 10 users testent en réel, ces choses deviendront évidentes et urgentes :

1. **ETags GitHub** : sinon le rate limit explose dès quelques dizaines de repos.
2. **Filtrage des issues mortes** (>6 mois sans activité, ou déjà assignées) : sinon les résultats sont décevants.
3. **Refresh manuel** côté user : ils voudront forcer le re-scan.
4. **Gestion d'erreurs propre** : retry sur les 5xx GitHub, alertes basiques.

Voir `ROADMAP.md` pour le détail des phases suivantes.

---

## Pièges à éviter pendant le MVP

- ❌ **Vouloir faire propre tout de suite** : pas de tests à 100% de coverage, pas de CI/CD compliquée. Livre, puis itère.
- ❌ **Sur-modéliser le schéma DB** : les colonnes peuvent être ajoutées plus tard avec une migration.
- ❌ **Optimiser prématurément** : pas de cache ristretto au MVP, SQLite va vite tout seul.
- ❌ **Vouloir une UI parfaite** : Tailwind par défaut + bonne hiérarchie suffit. Le design vient après.
- ❌ **Ajouter des dépendances "au cas où"** : chaque lib ajoutée doit servir aujourd'hui.
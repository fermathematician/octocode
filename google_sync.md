# Deploying Octocode on Render + Neon (with Google Calendar sync)

This guide takes the repo from local to a public deployment:

```text
Browser
  │
  ├─ Render Static Site (frontend/)            https://app.example.com
  │     VITE_API_URL = https://api.example.com
  │
  └─ Render Web Service (backend/)             https://api.example.com
        DATABASE_URL  → Neon (PostgreSQL)
        GITHUB_*      → GitHub OAuth App  (login + repos)
        GOOGLE_*      → Google OAuth client (Calendar sync)
```

The backend and frontend are separate Render services. One Postgres database (Neon) is shared by all
users; rows are scoped per user (`ownerId` / `userId`), so users see only their own data.

> Read `README.md` for the full architecture. This file is only the deployment runbook.

---

## 0. Prerequisites

- A **Neon** account (Postgres).
- A **Render** account.
- A **GitHub OAuth App** (for login) — see §3.
- A **Google Cloud** project with the **Google Calendar API** enabled and an OAuth client — see §4.

Decide your domains up front. The examples use:

- Frontend: `https://app.example.com`
- API: `https://api.example.com`

Using a single parent domain (two subdomains) is recommended: cookies/calls stay **same-site**, so the
`SameSite=Lax` session cookie works without extra cookie configuration. If you use unrelated hostnames
(e.g. `foo.vercel.app` → `bar.onrender.com`), see §7.

---

## 1. Neon database

1. Create a project in Neon. Create a database (e.g. `octocode`).
2. Copy **two** connection strings from the Neon dashboard:
   - **Pooled** (hostname contains `-pooler`) → used by the app.
   - **Direct** (no `-pooler`) → used by migrations.
3. Append `?sslmode=require` if it is not already present.
4. Add these as Render env vars later:
   - `DATABASE_URL` = pooled string
   - `DIRECT_URL` = direct string

Notes:
- Neon is serverless Postgres; the `@prisma/adapter-pg` driver connects over TCP with TLS.
- The pooled endpoint (PgBouncer) is fine for the runtime driver. Use the **direct** endpoint for
  `prisma migrate deploy` (DDL through a transaction pooler can fail).

---

## 2. (Local sanity check before deploying)

```bash
cd backend
npm install
npx prisma generate
# point DATABASE_URL at the Neon DIRECT string for migrations
DATABASE_URL="<neon-direct-url>" npx prisma migrate deploy
npm run typecheck && npm run lint && npm test && npm run build
```

`npm test` does not need a database.

---

## 3. GitHub OAuth App (login + repository access)

GitHub → **Settings → Developer settings → OAuth Apps → New OAuth App**:

- **Application name**: `Octocode`
- **Homepage URL**: `https://app.example.com`
- **Authorization callback URL**: `https://api.example.com/auth/github/callback`

Copy the **Client ID** and generate a **Client secret**. These go into the backend env as
`GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` / `GITHUB_OAUTH_CALLBACK_URL`.

Requested scopes (`read:user user:email repo`) are set in code (`FetchGithubClient.getAuthorizeUrl`),
not in the GitHub UI.

---

## 4. Google Calendar OAuth client

1. **Google Cloud Console** → create (or pick) a project.
2. **APIs & Services → Library** → enable **Google Calendar API**.
3. **APIs & Services → OAuth consent screen**:
   - User type **External**.
   - App name, support email, developer contact.
   - Scopes: add `https://www.googleapis.com/auth/calendar.events`.
   - While in **Testing**, add every Google account that may connect as a **test user**. For a public
     launch you must submit the app for **verification** (Calendar scopes are sensitive).
4. **APIs & Services → Credentials → Create credentials → OAuth client ID**:
   - Application type: **Web application**.
   - **Authorized redirect URIs**: `https://api.example.com/calendar/google/callback`
   - **Authorized JavaScript origins**: `https://app.example.com`
5. Copy the **Client ID** and **Client secret** → backend env `GOOGLE_CLIENT_ID` /
   `GOOGLE_CLIENT_SECRET` / `GOOGLE_OAUTH_CALLBACK_URL`.

Each user connects **their own** Google account from the Calendar page; the app never uses the
operator's account.

---

## 5. Backend on Render (Web Service)

Create → **Web Service** → connect the repo.

- **Root Directory**: `backend`
- **Runtime**: Node
- **Build Command**:
  ```bash
  npm install && npx prisma generate && npm run build
  ```
- **Start Command**:
  ```bash
  npm run start
  ```
- **Release Command** (runs before the new version goes live):
  ```bash
  DATABASE_URL="$DIRECT_URL" npx prisma migrate deploy
  ```
- **Health Check Path**: `/health`
- **Auto-Deploy**: on (per your preference)

### Environment variables

| Key | Value |
| --- | --- |
| `NODE_ENV` | `production` |
| `DATABASE_URL` | Neon **pooled** URL |
| `DIRECT_URL` | Neon **direct** URL (used only by the release command) |
| `TOKEN_ENCRYPTION_KEY` | fresh base64 32-byte key (see below) |
| `TRUST_PROXY` | `true` (Render terminates TLS in front of the app) |
| `COOKIE_SECURE` | `true` |
| `FRONTEND_URL` | `https://app.example.com` |
| `CORS_ORIGIN` | `https://app.example.com` |
| `GITHUB_CLIENT_ID` | from §3 |
| `GITHUB_CLIENT_SECRET` | from §3 |
| `GITHUB_OAUTH_CALLBACK_URL` | `https://api.example.com/auth/github/callback` |
| `GOOGLE_CLIENT_ID` | from §4 |
| `GOOGLE_CLIENT_SECRET` | from §4 |
| `GOOGLE_OAUTH_CALLBACK_URL` | `https://api.example.com/calendar/google/callback` |
| `GOOGLE_CALENDAR_TIME_ZONE` | your time zone, e.g. `America/Sao_Paulo` (default `UTC`) |
| `GOOGLE_CALENDAR_SYNC_INTERVAL_MS` | `900000` (15 min) |
| `ALLOW_DEV_TOKEN_LOGIN` | `false` (**never** enable in production) |

Generate the encryption key:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

`PORT` is provided by Render — do not set it.

> `COOKIE_SECURE=true` requires HTTPS, which Render provides.
> `TRUST_PROXY=true` makes Express read the real client IP from `X-Forwarded-For` (needed for accurate
> rate limiting and logs).

---

## 6. Frontend on Render (Static Site)

Create → **Static Site** → connect the repo.

- **Root Directory**: `frontend`
- **Build Command**: `npm install && npm run build`
- **Publish Directory**: `dist`

### Environment variables (set **before** the build)

| Key | Value |
| --- | --- |
| `VITE_API_URL` | `https://api.example.com` |
| `VITE_DEV_LOGIN` | `false` |

Vite inlines `VITE_*` at build time, so changing them requires a rebuild/redeploy.

Optional: add a **Rewrite** rule `/* → /index.html` (200) if you later add client-side routing. The
current app switches screens in state, so it is not strictly needed.

---

## 7. Domains, cookies, and CORS

- **Recommended:** `app.example.com` (frontend) + `api.example.com` (backend). Same registrable
  domain → the session cookie (`SameSite=Lax`) and credentialed CORS just work.
- **Different registrable domains** (e.g. `*.vercel.app` + `*.onrender.com`): the session cookie may
  be treated as cross-site and not sent on XHR. You would need `SameSite=None; Secure`, which is not
  configurable yet — either put both behind one custom domain, or add a cookie `SameSite` env option.
- `CORS_ORIGIN` must be the **exact** frontend origin (no trailing slash). In non-production the
  backend also allows any `localhost`/`127.0.0.1` origin; production only allows `CORS_ORIGIN`.
- Add both custom domains in Render → each service → **Settings → Custom Domains**, then point DNS.

---

## 8. Post-deploy verification

```bash
curl -s https://api.example.com/health   # {"status":"ok"}
curl -s https://api.example.com/ready    # {"status":"ready"} (DB reachable) or 503
```

In the browser:

1. Open `https://app.example.com` → **Sign in with GitHub** → authorize.
2. **All projects → Add project** → pick a repo (uses your GitHub token).
3. **Calendar → Connect Google Calendar** → authorize in Google.
4. Back on the Calendar page, click **Sync now**. You should see
   `Synced: N pulled, M pushed, K removed.` and a "Google" tag on imported events.
5. Create an event in Octocode, **Sync now** → it appears in Google Calendar.
6. Delete an Octocode event → it is removed in Google too.

---

## 9. Ongoing operations

- **Migrations** run automatically via the Release Command (`prisma migrate deploy`).
- **Background sync**: every `GOOGLE_CALENDAR_SYNC_INTERVAL_MS`, the process syncs all connected
  users. With multiple app instances, each instance syncs — harmless but redundant.
- **Session cleanup** runs on boot and on an interval (see `SESSION_CLEANUP_INTERVAL_MS`).
- **Rate limiting** is in-memory per instance (not shared across instances).
- **Rotate secrets** by updating the Render env var and redeploying:
  - GitHub/Google client secrets (regenerate in their consoles).
  - `TOKEN_ENCRYPTION_KEY` — **rotating it invalidates stored tokens**; users must reconnect GitHub
    and Google afterwards.
- **Google verification**: keep the consent screen in **Testing** (test users only) until you are
  ready to submit for verification for public use.

---

## 10. Troubleshooting

| Symptom | Likely cause |
| --- | --- |
| Login redirect returns to `/?auth=error` | GitHub callback URL mismatch, or `GITHUB_CLIENT_ID`/`SECRET` missing. |
| Login works but API calls 401 | `COOKIE_SECURE=false` over HTTPS, or frontend/back-end on different sites (§7). |
| `/ready` is 503 | Wrong `DATABASE_URL`, missing `sslmode=require`, or Neon suspended. |
| "Add project" shows an error | GitHub token lacking `repo` scope, or the repo is already linked to one of your projects. |
| "Connect Google Calendar" returns to `?google=error` | Google redirect URI mismatch or Google client id/secret missing. |
| Sync does nothing | Consent screen missing the `calendar.events` scope, or the account is not a test user. |
| Times look shifted | Set `GOOGLE_CALENDAR_TIME_ZONE` to your zone (per-user zones are not modeled). |
| Rate limiting blocks everyone at once | `TRUST_PROXY` not set — all requests share the proxy IP. |

---

## 11. Scaling notes / known limitations

- Single-owner projects (no collaboration/membership yet).
- No pagination UI for >100 items on a list screen.
- Google sync: local-wins conflicts, all-day events skipped, one time zone, no Google push
  notifications (in-app sync notifications only).
- Background jobs (session cleanup, calendar sync) run in-process; at scale move them to a Render
  Cron Job or a queue.

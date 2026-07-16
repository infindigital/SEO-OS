# Deployment

How to run the SEO OS in production. The app is a standalone Next.js 15 server
backed by PostgreSQL (Supabase) and Supabase Auth/Storage, with optional Google
Search Console integration and scheduled Python pipelines.

## 1. Prerequisites

- **Node.js 22** (see `.nvmrc`).
- **PostgreSQL 16** — managed (Supabase recommended) or self-hosted.
- **Supabase project** — provides Auth, Storage, and the Postgres database.
- **Python 3.11+** — only if you run the crawl/analytics/reporting pipelines.
- **Chromium** — only for the crawler (`playwright-core` does not bundle a
  browser).

## 2. Environment variables

Copy `.env.example` to `.env` and fill in every value. None may be committed.

| Variable | Required | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | yes | Supabase project URL (browser-visible). |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | yes | Supabase anon key (browser-visible). |
| `SUPABASE_SERVICE_ROLE_KEY` | yes | Server-only service role key. **Never expose.** |
| `DATABASE_URL` | yes | Pooled Postgres connection (PgBouncer, port `6543`). Runtime queries. |
| `DIRECT_URL` | yes | Direct Postgres connection (port `5432`). **Required for migrations.** |
| `SEED_ADMIN_EMAILS` | recommended | Comma-separated emails bootstrapped as `ADMIN` on signup. |
| `PLAYWRIGHT_CHROMIUM_EXECUTABLE` | crawler only | Path to the Chromium binary. |
| `GOOGLE_OAUTH_CLIENT_ID` | GSC only | OAuth client id (scope `webmasters.readonly`). |
| `GOOGLE_OAUTH_CLIENT_SECRET` | GSC only | OAuth client secret. |
| `GOOGLE_OAUTH_REDIRECT_URI` | GSC only | Must match the deployed callback URL. |
| `CRON_SECRET` | scheduled sync | Shared secret for `/api/cron/search-console`. |

> **`DATABASE_URL` vs `DIRECT_URL`:** the app talks to the pooled connection at
> runtime; Prisma migrations must use the direct connection. Both are required —
> `prisma migrate deploy` fails schema validation if `DIRECT_URL` is unset.

## 3. Database setup

```bash
npm ci
npm run prisma:generate     # generate the Prisma client
npm run prisma:deploy       # apply migrations (uses DIRECT_URL)
npm run db:seed             # optional: demo data
```

`prisma:deploy` runs `prisma migrate deploy`, which applies the committed
migrations in `prisma/migrations/` without generating new ones — the correct
command for production.

## 4. Build & run

### Standalone Node server

```bash
npm ci
npm run build               # produces .next/standalone
node .next/standalone/server.js
```

`next.config.ts` sets `output: "standalone"`, so the build emits a
self-contained server with only the files it needs.

### Docker

A multi-stage `Dockerfile` builds the standalone image; `docker-compose.yml`
runs the app alongside a Postgres 16 container.

```bash
docker compose up --build
```

The image does **not** run migrations on start. Run
`npm run prisma:deploy` (or `docker compose run --rm app npx prisma migrate deploy`)
against the target database as a separate release step before the new image
serves traffic.

### Managed platforms (e.g. Vercel)

- Set all environment variables in the platform's dashboard.
- Add a build/release step that runs `prisma migrate deploy` before promotion.
- The `postinstall` script runs `prisma generate` automatically.

## 5. Health check

`GET /api/health` returns `200` with `{ "status": "ok" }` for liveness/readiness
probes (load balancers, `docker-compose` healthchecks, Kubernetes). It performs
no authentication and touches no external services.

## 6. Scheduled jobs

### Search Console sync (in-app)

Schedule an authenticated call to the cron endpoint (daily is typical):

```bash
curl -fsS -X POST "$APP_URL/api/cron/search-console" \
  -H "Authorization: Bearer $CRON_SECRET"
```

Use a Vercel Cron, Kubernetes CronJob, or any external scheduler. The default
recommended schedule is `0 3 * * *` (see `automations/search-console-sync.ts`).

### Python pipeline workflows (GitHub Actions)

Three workflows run pipelines on a cron and commit their artifacts back:

| Workflow | Schedule | Output |
| --- | --- | --- |
| `.github/workflows/weekly-seo.yml` | Mondays 06:00 UTC | crawl → audit reports |
| `.github/workflows/search-console-sync.yml` | daily 05:00 UTC | `reports/search-console/` |
| `.github/workflows/analytics-sync.yml` | daily 05:30 UTC | `reports/ga4/` |

Configure their secrets/variables (`GSC_SITE`/`GSC_CREDENTIALS_JSON`,
`GA4_PROPERTY_ID`/`GA4_CREDENTIALS_JSON`); each falls back to an offline sample
if not configured, so it never fails hard.

## 7. Continuous integration

`.github/workflows/ci.yml` runs on every push to `main` and every PR: install →
prisma generate/validate → lint → typecheck → unit tests → component tests →
build, plus a Python job running the pipeline test suites and an integration
job running the Prisma repository tests against a Postgres service.

## 8. Production readiness checklist

- [ ] All required environment variables set (Section 2).
- [ ] `DIRECT_URL` set and reachable for migrations.
- [ ] `prisma migrate deploy` run against the production database.
- [ ] `SUPABASE_SERVICE_ROLE_KEY` and `CRON_SECRET` stored as secrets, never in
      the client bundle or the repo.
- [ ] `GOOGLE_OAUTH_REDIRECT_URI` matches the deployed callback URL exactly.
- [ ] `SEED_ADMIN_EMAILS` set so the first admin can sign in.
- [ ] Health check (`/api/health`) wired to the orchestrator/load balancer.
- [ ] Scheduled sync configured (cron → `/api/cron/search-console`).
- [ ] `npm run build` succeeds and CI is green.
- [ ] Database backups enabled on the managed Postgres.

## 9. Verification after deploy

```bash
curl -fsS "$APP_URL/api/health"        # → {"status":"ok", ...}
# Sign in with a SEED_ADMIN_EMAILS account and confirm the dashboard loads.
# Trigger a manual sync and confirm a 200 + row counts:
curl -fsS -X POST "$APP_URL/api/cron/search-console" -H "Authorization: Bearer $CRON_SECRET"
```

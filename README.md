# SEO OS

The AI-powered SEO Operating System by **Infin Digital**.

Built as a modular monolith following **Clean Architecture**: a single
deployable Next.js application internally split into layers whose dependencies
point strictly inward.

## Tech stack

| Concern        | Choice                                             |
| -------------- | -------------------------------------------------- |
| Framework      | Next.js (App Router) + React                       |
| Language       | TypeScript (strict)                                |
| Styling        | Tailwind CSS                                        |
| Database       | PostgreSQL via Supabase                             |
| ORM            | Prisma                                              |
| Auth / storage | Supabase                                            |
| CI             | GitHub Actions                                      |
| Packaging      | Docker (multi-stage, standalone output)            |

## Repository layout

```
src/app/          Next.js App Router — routing + server entry (delivery layer)
src/lib/          Infrastructure clients (Prisma, Supabase)

backend/          Clean Architecture core
  domain/           Entities, value objects, domain services (pure)
  application/      Use cases + ports
  infrastructure/   Port implementations (DB, APIs, AI providers)
  interface/        Controllers & mappers (transport ↔ use cases)

frontend/         Shared UI: design system, components, hooks
dashboard/        Operator-facing feature modules
agents/           AI agent definitions
knowledge/        Knowledge base / retrieval sources
templates/        Content brief, report, and outreach templates
automations/      Scheduled & event-driven workflows
clients/          Per-client workspace configuration
scripts/          Developer & ops tooling
reports/          Generated report output (gitignored contents)

prisma/           Prisma schema & migrations
.github/workflows CI pipeline
```

Path aliases (`@/*`, `@backend/*`, `@frontend/*`, `@dashboard/*`, `@agents/*`,
`@knowledge/*`, `@templates/*`, `@automations/*`) are configured in
`tsconfig.json`.

## Getting started

Requires **Node.js 22+** (see `.nvmrc`).

```bash
# 1. Install dependencies (generates the Prisma client via postinstall)
npm install

# 2. Configure the environment
cp .env.example .env
# ...fill in Supabase and database values

# 3. Run the development server
npm run dev
```

The app runs at http://localhost:3000.

## Scripts

| Command                  | Description                                  |
| ------------------------ | -------------------------------------------- |
| `npm run dev`            | Start the Next.js dev server                 |
| `npm run build`          | Production build (standalone output)         |
| `npm run start`          | Serve the production build                   |
| `npm run lint`           | Lint with ESLint (`next lint`)               |
| `npm run typecheck`      | Type-check with `tsc --noEmit`               |
| `npm run format`         | Format with Prettier                         |
| `npm run prisma:migrate` | Create & apply a dev migration               |
| `npm run prisma:studio`  | Open Prisma Studio                           |
| `npm run db:push`        | Push the schema without a migration          |

## SEO crawler

Crawl a site with Playwright and save the result as JSON under `reports/`:

```bash
export PLAYWRIGHT_CHROMIUM_EXECUTABLE=/path/to/chromium
npm run crawl -- https://example.com --max-pages=50 --max-depth=2
```

For each discovered page it collects the status code, response time, title, meta
description, canonical, meta robots, H1/H2, image and missing-alt counts, word
count, schema.org types, and internal/external links. `playwright-core` does not
bundle a browser, so `PLAYWRIGHT_CHROMIUM_EXECUTABLE` must point at a Chromium
binary. Browser-backed crawler tests run via `npm run test:crawler`.

Analyze a saved crawl for SEO issues (rule-based, no AI) and write a JSON report:

```bash
npm run analyze -- reports/crawl-example.com-....json --thin-content=250 --large-image-kb=100
```

It flags HTTP errors (404), redirect chains, duplicate titles/descriptions,
missing H1s, thin content, broken internal links, missing canonicals, large
images, and images missing alt text.

Turn a crawl (or analysis) report into a prioritized technical audit — developer
tasks with business/SEO impact, recommended fixes, effort estimates and
acceptance criteria — saved as both Markdown and JSON:

```bash
npm run audit -- reports/crawl-example.com-....json
```

Track progress across crawls for a client: compare a new crawl against the
client's previous one (new / resolved / remaining issues + an improvement
score) and update the client's memory (`clients/<clientId>/memory.json`):

```bash
npm run track -- <clientId> reports/crawl-example.com-....json
```

## Google Search Console

Connect a client's Search Console property and store its queries, pages, CTR,
clicks, impressions, and index coverage.

- **Connect:** send a staff user to `GET /api/search-console/connect?clientId=…&siteUrl=…`;
  the OAuth callback stores the connection. Requires `GOOGLE_OAUTH_CLIENT_ID`,
  `GOOGLE_OAUTH_CLIENT_SECRET`, and `GOOGLE_OAUTH_REDIRECT_URI`.
- **Automatic updates:** a scheduler triggers `POST /api/cron/search-console`
  (`Authorization: Bearer $CRON_SECRET`) on a schedule — daily at 03:00 UTC
  (see `automations/search-console-sync.ts`) — to sync all connected properties.

## Docker

```bash
# Build and run the app together with a local Postgres instance
docker compose up --build
```

The production image is a multi-stage build emitting Next.js standalone output
(`Dockerfile`).

## Continuous integration

Every push to `main` and every pull request runs lint, typecheck, Prisma schema
validation, and a production build via GitHub Actions (`.github/workflows/ci.yml`).

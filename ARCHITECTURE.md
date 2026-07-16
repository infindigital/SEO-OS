# Architecture

Infin Digital's SEO OS is a Next.js 15 application backed by a clean-architecture
TypeScript core, a PostgreSQL database (via Prisma + Supabase), and a set of
standalone Python pipelines for crawling, analysis, and reporting. This document
describes how those pieces fit together.

## High-level shape

```
                         ┌──────────────────────────────┐
   Browser ──────────────▶  Next.js App Router (src/app) │
                         │   pages · server actions · API │
                         └───────────────┬───────────────┘
                                         │ calls
                         ┌───────────────▼───────────────┐
                         │  Interface layer (controllers, │
                         │  zod schemas, ActionResult)     │
                         └───────────────┬───────────────┘
                         ┌───────────────▼───────────────┐
                         │  Application layer (use cases,  │
                         │  ports)                         │
                         └───────────────┬───────────────┘
              ┌──────────────────────────┼──────────────────────────┐
   ┌──────────▼──────────┐   ┌───────────▼───────────┐   ┌───────────▼─────────┐
   │  Domain layer        │   │  Infrastructure        │   │  External services   │
   │  (entities, rules)   │   │  (Prisma, Supabase,    │   │  Supabase Auth/Storage│
   │                      │   │   Google APIs, adapters)│  │  Google Search Console│
   └──────────────────────┘   └────────────────────────┘   └──────────────────────┘

   Python file pipelines (offline / scheduled):
   crawler ─▶ analyzer ─▶ generator        searchconsole ─▶ ga4 ─▶ reporting
      crawl.json   audit.json  *.md              *.json              report.md/pdf
```

The web app and the Python pipelines are **decoupled**: the pipelines read and
write JSON/Markdown artifacts (`crawl.json`, `audit.json`, `search-console.json`,
`ga4.json`, `report.md`/`report.pdf`) that can be produced on a schedule and
consumed by the app or committed to the repo. Nothing in the web request path
depends on Python.

## Clean architecture (`backend/`)

The TypeScript core follows a strict dependency rule: **dependencies point
inward**. Outer layers depend on inner layers, never the reverse.

| Layer | Directory | Contains | Depends on |
| --- | --- | --- | --- |
| **Domain** | `backend/domain` | Entities, value objects, business rules (e.g. `Client`, `DeveloperTask`, audit generation, URL helpers). Pure, no I/O. | nothing |
| **Application** | `backend/application` | Use cases (one class per operation) and **ports** (interfaces the outer layers implement, e.g. `ClientRepository`, `SearchConsoleGateway`). | domain |
| **Infrastructure** | `backend/infrastructure` | Port implementations: Prisma repositories, Supabase storage, Google API gateways, id/clock adapters, and the DI **container**. | application, domain |
| **Interface** | `backend/interface` | Controllers, zod input schemas, and the `ActionResult<T>` result type that adapts use cases to callers (API routes, server actions). | application, domain |

### Key conventions

- **Ports & adapters.** Every external dependency (database, storage, HTTP API,
  clock, id generator) is an interface in `application/**/ports` with a real
  implementation in `infrastructure/` and an in-memory fake used by tests.
- **Use cases** are single-responsibility classes with an `execute(...)` method.
  They orchestrate domain objects and ports; they contain no framework code.
- **`ActionResult<T>`** (`backend/interface/shared`) is the uniform result
  envelope — `ok(data)` / `failure(error)` / `fromZodError(...)` — returned by
  controllers so API routes and server actions handle success and validation
  errors identically.
- **Dependency injection** is centralized in
  `backend/infrastructure/container.ts`, which wires concrete adapters into use
  cases and exports ready-to-use modules (`clientUseCases`, `searchConsole`,
  `developerTaskUseCases`, dashboards, client portal, …).
- **Validation** happens at the interface boundary with zod; domain objects
  assume valid input and enforce invariants in their constructors/factories.

## Web layer (`src/app`, Next.js App Router)

- **Route groups:** `(auth)` (login/signup) and `(dashboard)` (the app shell).
- **Pages** are React Server Components that call use cases directly (read
  paths) and render client components from `dashboard/` and `frontend/`.
- **Server actions** (`actions.ts` per route) are the primary write path. Each
  is guarded by `authorizeAction([...roles])` and returns an `ActionResult`.
- **API routes** (`src/app/api/**/route.ts`) expose REST endpoints for clients,
  the Search Console OAuth flow, and the scheduled sync trigger. Staff routes
  are guarded by `requireStaffApi()`; the cron route by a bearer `CRON_SECRET`.
- **Middleware** (`src/middleware.ts`) refreshes the Supabase session and gates
  authenticated routes.

### Authentication & authorization

- **Authentication** is handled by Supabase Auth via `@supabase/ssr`. A
  `Profile` row mirrors each Supabase user and is the source of truth for role.
- **Roles:** `ADMIN`, `DEVELOPER`, `CLIENT`. `STAFF_ROLES = [ADMIN, DEVELOPER]`.
- **Guards:** `requireUser` / `requireRole` (server components & API),
  `authorizeAction` (server actions), `requireStaffApi` (API routes). Clients
  are redirected from `/dashboard` to their `/portal`.

## Data layer

- **PostgreSQL** accessed through **Prisma** (`@prisma/client`). See
  [`DATABASE_SCHEMA.md`](./DATABASE_SCHEMA.md).
- **Connections:** `DATABASE_URL` is the pooled (PgBouncer) connection used at
  runtime; `DIRECT_URL` is the direct connection used for migrations.
- **Object storage:** developer-task screenshots are stored in Supabase Storage
  via the `ScreenshotStorage` port.

## Python file pipelines

Each pipeline is a self-contained package with a `run_*.py` CLI, a `conftest.py`
that makes the package importable, a `tests/` suite, and a `README.md`. They
share a house style: a **protocol-based client** with a live adapter and an
offline sample double, deterministic builders (timestamps/dates injected, never
read from the clock), and a lazy import of any heavy/optional dependency.

| Package | Input | Output | Purpose |
| --- | --- | --- | --- |
| `crawler/` | a URL | `crawl.json` | Crawl4AI + Playwright site crawl (per-page SEO data). |
| `analyzer/` | `crawl.json` | `audit.json` | Detect technical SEO issues (stdlib only). |
| `generator/` | `audit.json` | `technical-audit.md`, `developer-tasks.md` | Turn issues into prioritized tasks; optional Claude narrator. |
| `memory/` | client id | `memory.md` | Per-client memory (goals, history) loaded before recommendations. |
| `searchconsole/` | GSC property | `search-console.json` | Clicks/impressions/CTR/position + top queries/pages. |
| `ga4/` | GA4 property | `ga4.json` | Users/sessions/conversions + top pages/events. |
| `reporting/` | the above artifacts | `report.md`, `report.pdf` | Seven-section monthly client report. |

Scheduled GitHub Actions workflows (`.github/workflows/`) run the crawl/audit,
Search Console, and GA4 pipelines on a cron and commit their artifacts back.

## AI agents (`agents/`)

`agents/definitions/` holds eight agent definitions (SEO Director, Technical
SEO, Content Strategist, Local SEO, Link Building, Reporting, QA, Developer
Reviewer), each with a Role, Responsibilities, Rules, SOP, and Output Format,
plus a machine-readable `manifest.json`. Agents are grounded in the file
pipeline (they declare which artifacts they consume and produce) and are
consumed by the application layer.

## Testing strategy

| Suite | Command | Scope |
| --- | --- | --- |
| Unit (TS) | `npm run test` | Domain, use cases, controllers — with in-memory fakes. |
| Components | `npm run test:components` | React components via server rendering. |
| Integration | `npx vitest run --config vitest.integration.config.ts` | Prisma repositories against a live PostgreSQL (serial). |
| Crawler (TS) | `npm run test:crawler` | The TypeScript crawl helpers. |
| Python | `python3 -m pytest <package>/tests` | Each Python pipeline package. |
| Typecheck / lint | `npm run typecheck` / `npm run lint` | Whole TS codebase. |

## Directory map

```
src/app/            Next.js routes: pages, server actions, API handlers
src/lib/            Auth/session helpers, Supabase clients
backend/domain/     Entities, value objects, business rules
backend/application/ Use cases + ports
backend/infrastructure/ Prisma/Supabase/Google adapters + DI container
backend/interface/  Controllers, zod schemas, ActionResult
dashboard/, frontend/ React UI (client components, charts, forms)
prisma/             schema.prisma + migrations + seed
crawler/ analyzer/ generator/ memory/ searchconsole/ ga4/ reporting/  Python pipelines
agents/             Agent definitions + manifest
scripts/            tsx CLIs (crawl, analyze, audit, weekly)
automations/        Scheduled-job entrypoints + config
docs/               Module docs (one folder per product module)
```

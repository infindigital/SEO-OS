# Database Schema

The SEO OS uses **PostgreSQL** via **Prisma**. The canonical source is
[`prisma/schema.prisma`](./prisma/schema.prisma); this document summarizes the
models, enums, relations, and indexes. Table/column names use `snake_case` in
the database (`@map`); Prisma models use `camelCase`.

## Connections

- `DATABASE_URL` — pooled connection (PgBouncer, e.g. Supabase port `6543`),
  used by the application at runtime.
- `DIRECT_URL` — direct connection (port `5432`), used by Prisma for migrations
  (`prisma migrate deploy`).

## Enums

| Enum | Values |
| --- | --- |
| `UserRole` | `ADMIN`, `DEVELOPER`, `CLIENT` |
| `ClientStatus` | `PROSPECT`, `ONBOARDING`, `ACTIVE`, `PAUSED`, `CHURNED` |
| `DevTaskPriority` | `LOW`, `MEDIUM`, `HIGH`, `CRITICAL` |
| `DevTaskStatus` | `OPEN`, `IN_PROGRESS`, `BLOCKED`, `DONE` |
| `ConnectionStatus` | `CONNECTED`, `DISCONNECTED`, `ERROR` |
| `SearchDimension` | `QUERY`, `PAGE` |

## Entity relationships

```
Profile 1──* Client            (owner, ownerId → Profile, SetNull)
Profile 1──* DeveloperTask      (assignee, assigneeId → Profile, SetNull)
Client  1──* ClientReport                         (Cascade)
Client  1──* DeveloperTask      (clientId → Client, SetNull)
Client  1──* SearchConsoleConnection              (Cascade)
DeveloperTask 1──* DeveloperTaskNote              (Cascade)
DeveloperTask 1──* DeveloperTaskScreenshot        (Cascade)
SearchConsoleConnection 1──* SearchAnalyticsRow   (Cascade)
SearchConsoleConnection 1──* PageCoverage         (Cascade)
```

## Models

### `Profile` → `profiles`
Application profile for a Supabase-authenticated user. `id` equals the Supabase
`auth.users` id; `role` is the source of truth for authorization.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | uuid | PK; matches Supabase auth id |
| `email` | string | **unique** |
| `role` | `UserRole` | default `CLIENT` |
| `createdAt`/`updatedAt` | datetime | |

### `Client` → `clients`
A client workspace.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | uuid | PK |
| `name` | string | |
| `website` | string? | |
| `contactName` / `contactEmail` | string? | |
| `status` | `ClientStatus` | default `PROSPECT` |
| `ownerId` | uuid? | → `Profile` (SetNull) |
| `industry` | string? | |
| `monthlyRetainer` | int? | |
| `seoScore` | int? | |
| `lastAuditAt` | datetime? | |
| `currentFocus` | string? | |
| `notes` | string? | |
| `archivedAt` | datetime? | soft archive |
| `createdAt`/`updatedAt` | datetime | |

Indexes: `status`, `name`, `ownerId`, `archivedAt`, `contactEmail`.

### `ClientReport` → `client_reports`
A client-facing report surfaced on the portal.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | uuid | PK |
| `clientId` | uuid | → `Client` (**Cascade**) |
| `title` | string | |
| `period` | string? | e.g. "July 2026" |
| `summary` | string? | |
| `url` | string? | link to the artifact |
| `publishedAt` | datetime | default now |
| `createdAt` | datetime | |

Index: `clientId`.

### `DeveloperTask` → `developer_tasks`
A unit of engineering work on the developer dashboard.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | uuid | PK |
| `title` | string | |
| `description` | string? | |
| `priority` | `DevTaskPriority` | default `MEDIUM` |
| `status` | `DevTaskStatus` | default `OPEN` |
| `completion` | int | 0–100 |
| `dueDate` | datetime? | |
| `assigneeId` | uuid? | → `Profile` (SetNull) |
| `clientId` | uuid? | → `Client` (SetNull) |
| `completedAt` | datetime? | |
| `createdAt`/`updatedAt` | datetime | |

Indexes: `assigneeId`, `clientId`, `status`.

### `DeveloperTaskNote` → `developer_task_notes`
| Column | Type | Notes |
| --- | --- | --- |
| `id` | uuid | PK |
| `taskId` | uuid | → `DeveloperTask` (**Cascade**) |
| `authorId` | uuid? | |
| `body` | string | |
| `createdAt` | datetime | |

Index: `taskId`.

### `DeveloperTaskScreenshot` → `developer_task_screenshots`
| Column | Type | Notes |
| --- | --- | --- |
| `id` | uuid | PK |
| `taskId` | uuid | → `DeveloperTask` (**Cascade**) |
| `uploaderId` | uuid? | |
| `path` | string | object-storage path (Supabase Storage) |
| `url` | string? | resolved public/signed URL |
| `caption` | string? | |
| `createdAt` | datetime | |

Index: `taskId`.

### `SearchConsoleConnection` → `search_console_connections`
A connected Google Search Console property for a client.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | uuid | PK |
| `clientId` | uuid | → `Client` (**Cascade**) |
| `siteUrl` | string | GSC property |
| `refreshToken` | string? | OAuth refresh token |
| `status` | `ConnectionStatus` | default `CONNECTED` |
| `lastSyncedAt` | datetime? | |
| `createdAt`/`updatedAt` | datetime | |

Unique: `(clientId, siteUrl)`.

### `SearchAnalyticsRow` → `search_analytics_rows`
A Search Console search-analytics row (per query or page, per day).

| Column | Type | Notes |
| --- | --- | --- |
| `id` | uuid | PK |
| `connectionId` | uuid | → `SearchConsoleConnection` (**Cascade**) |
| `dimension` | `SearchDimension` | `QUERY` or `PAGE` |
| `keyValue` | string | the query text or page URL |
| `date` | date | |
| `clicks` / `impressions` | int | |
| `ctr` / `position` | float | |
| `createdAt`/`updatedAt` | datetime | |

Unique: `(connectionId, dimension, keyValue, date)` — supports idempotent
upserts. Index: `(connectionId, dimension, date)` — supports the dashboard
aggregation queries (totals, top rows, keyword count).

### `PageCoverage` → `page_coverage`
Index-coverage status for a page, from the URL Inspection API.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | uuid | PK |
| `connectionId` | uuid | → `SearchConsoleConnection` (**Cascade**) |
| `page` | string | |
| `coverageState` | string | |
| `verdict` | string | |
| `lastCrawledAt` | datetime? | |
| `fetchedAt`/`updatedAt` | datetime | |

Unique: `(connectionId, page)`.

### `DailyMetric` → `daily_metrics`
A daily snapshot of headline metrics powering the internal dashboard. One row
per day, populated by ETL or the demo seed.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | uuid | PK |
| `date` | date | **unique** |
| `organicTraffic` | int | |
| `seoScore` | int | |
| `openTasks` | int | |
| `completedTasks` | int | default 0 |
| `criticalIssues` | int | default 0 |
| `monthlyRevenue` | int | default 0 |
| `developerProgress` / `contentProgress` | int | |
| `createdAt`/`updatedAt` | datetime | |

## Migrations

Migrations live in `prisma/migrations/` and are applied in order:

```
20260714090000_init_client
20260714094441_add_auth_profiles
20260714100118_add_daily_metrics
20260715120002_add_search_console
20260715152001_add_client_portfolio_fields
20260715155753_add_internal_dashboard_metrics
20260715172452_add_developer_tasks
20260715175239_add_client_reports
```

Apply in production with `npm run prisma:deploy` (`prisma migrate deploy`),
which requires `DIRECT_URL`. See [`DEPLOYMENT.md`](./DEPLOYMENT.md).

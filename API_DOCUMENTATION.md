# API Documentation

The SEO OS exposes two kinds of server-side entry points:

1. **REST API routes** (`src/app/api/**/route.ts`) — for programmatic/JSON
   access and the OAuth + cron integrations.
2. **Server actions** (`src/app/**/actions.ts`) — the primary write path for the
   UI, invoked directly from React components.

Both are backed by the same use cases and return validation/authorization
errors through the uniform `ActionResult<T>` envelope.

## Conventions

- **Auth:**
  - `requireStaffApi()` gates staff-only API routes (roles `ADMIN` or
    `DEVELOPER`). Unauthenticated → `401`; wrong role → `403`.
  - `authorizeAction([...roles])` gates server actions.
  - The cron route is gated by a shared secret (`CRON_SECRET`).
- **Errors:** JSON routes respond `{ "error": "<message>" }` with an
  appropriate status (`400` invalid body/validation, `401`/`403` auth,
  `404` not found, `409` conflict). Server actions return
  `{ ok: false, error }`.
- **Success:** JSON routes respond `{ "<resource>": <data> }`; server actions
  return `{ ok: true, data }`.
- All client routes are `dynamic = "force-dynamic"` (no caching).

---

## REST API

### Clients

#### `GET /api/clients`
List clients. **Staff only.**

Query parameters:

| Param | Type | Description |
| --- | --- | --- |
| `q` | string | Search by name/contact. |
| `status` | `PROSPECT`\|`ONBOARDING`\|`ACTIVE`\|`PAUSED`\|`CHURNED` | Filter by status. |
| `includeArchived` | `true`\|`false` | Include archived clients. |
| `archivedOnly` | `true`\|`false` | Only archived clients. |

Response `200`: `{ "clients": Client[] }`

#### `POST /api/clients`
Create a client. **Staff only.**

Request body (`createClientSchema`):

```json
{
  "name": "Acme Corp",
  "website": "https://acme.com/",
  "contactName": "Jane Doe",
  "contactEmail": "jane@acme.com",
  "status": "ACTIVE",
  "industry": "SaaS",
  "monthlyRetainer": 2500,
  "seoScore": 78,
  "currentFocus": "Core Web Vitals",
  "notes": "…"
}
```

`name` and `status` are required; the rest are optional. Response `201`:
`{ "client": Client }`. Invalid JSON → `400`; validation error → `400` with the
field message.

#### `GET /api/clients/{clientId}`
Fetch one client. **Staff only.** Response `200`: `{ "client": Client }`;
unknown id → `404`.

#### `PATCH /api/clients/{clientId}`
Update a client. **Staff only.** Body is the same shape as create
(`updateClientSchema`, id taken from the path). Response `200`:
`{ "client": Client }`.

#### `DELETE /api/clients/{clientId}`
Delete a client. **Staff only.** Response `200` on success; unknown id → `404`.

#### `POST /api/clients/{clientId}/archive`
Archive or restore a client. **Staff only.**

Request body: `{ "archived": true }` (default `true` if body omitted; send
`false` to restore). Response `200`: `{ "client": Client }`.

### Search Console (OAuth)

#### `GET /api/search-console/connect?clientId=<uuid>`
Begin the Google Search Console OAuth flow for a client. **Staff only.**
Redirects (`302`) to Google's consent screen. Missing/invalid `clientId` →
`400`.

#### `GET /api/search-console/callback?code=…&state=…`
OAuth redirect target. **Staff only.** Exchanges the code, stores the
connection, and redirects (`302`) to `/clients`. Invalid state → `400`; token
exchange failure → `400`/`502` with an error message.

### Scheduled sync (cron)

#### `GET|POST /api/cron/search-console`
Trigger the Search Console sync for all connected properties. **Secret-gated.**

Authenticate with either an `Authorization: Bearer <CRON_SECRET>` header or a
`?secret=<CRON_SECRET>` query parameter. Missing/incorrect secret → `401`.

Response `200`: the `SyncAllResult` summary (per-connection row counts). Intended
to be called on a schedule (Vercel Cron, Kubernetes CronJob, GitHub Actions, or
any external scheduler) — see [`DEPLOYMENT.md`](./DEPLOYMENT.md).

---

## Server actions

All are `"use server"` functions returning `ActionResult<T>` (except sign-out,
which redirects). Inputs are validated with zod; unauthorized calls return a
failure result.

### Auth — `src/app/(auth)/actions.ts`
| Action | Guard | Purpose |
| --- | --- | --- |
| `signInAction(input)` | public | Sign in with email/password. |
| `signUpAction(input)` | public | Register (first `SEED_ADMIN_EMAILS` become `ADMIN`, others `CLIENT`). |
| `signOutAction()` | authenticated | Sign out and redirect to login. |

### Clients — `src/app/(dashboard)/clients/actions.ts`
| Action | Guard | Purpose |
| --- | --- | --- |
| `createClientAction(input)` | staff | Create a client. |
| `updateClientAction(input)` | staff | Update a client. |
| `deleteClientAction(input)` | staff | Delete a client. |
| `archiveClientAction(input)` | staff | Archive/restore a client. |

### Developer tasks — `src/app/(dashboard)/developer/actions.ts`
| Action | Guard | Purpose |
| --- | --- | --- |
| `createTaskAction(input)` | staff | Create a developer task. |
| `updateTaskAction(input)` | staff | Update task fields/status/completion. |
| `markTaskCompleteAction(input)` | staff | Mark a task done. |
| `addTaskNoteAction(input)` | staff | Append a note to a task. |

Screenshot uploads go through the task upload flow, persisted to Supabase
Storage via the `ScreenshotStorage` port.

### Admin — `src/app/(dashboard)/admin/actions.ts`
| Action | Guard | Purpose |
| --- | --- | --- |
| `updateUserRoleAction(input)` | `ADMIN` | Promote/demote a user's role. |

### Client portal — `src/app/(dashboard)/portal/actions.ts`
| Action | Guard | Purpose |
| --- | --- | --- |
| `publishReportAction(input)` | staff | Publish a report to a client's portal. |

---

## Data types

`Client`, `DeveloperTask`, `ClientReport`, and the Search Console entities are
defined in [`DATABASE_SCHEMA.md`](./DATABASE_SCHEMA.md). API responses return the
mapped view models produced by the controllers (dates as ISO-8601 strings).

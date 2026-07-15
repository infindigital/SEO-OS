# API & endpoints

Server surface conventions:

- **Server Actions** — mutations from forms, validated with zod in the interface
  layer; authorized server-side (`requireRole` / `authorizeAction`).
- **Route Handlers** (`src/app/api/**`) — OAuth callbacks and cron, e.g.
  `GET /api/search-console/connect`, `GET /api/search-console/callback`,
  `POST /api/cron/search-console` (protected by `CRON_SECRET`).
- **CLI** (`scripts/`) — the crawl → analyze → audit → track pipeline
  (`npm run crawl|analyze|audit|track|weekly`).

Per-module endpoints (implemented and planned) are listed in
[`../../PROJECT_SPEC.md`](../../PROJECT_SPEC.md).

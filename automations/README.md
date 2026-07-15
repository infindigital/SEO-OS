# automations

Scheduled and event-driven workflows: recurring audits, rank-tracking pulls,
report generation, and agent pipelines that run without a human in the loop.

Automations are thin orchestrators — they invoke application use cases from
`backend/`. Scheduling definitions (cron expressions, triggers) and workflow
composition live here. Imported via the `@automations/*` path alias.

## Weekly SEO audit

`.github/workflows/weekly-seo.yml` runs every Monday (06:00 UTC). For each site
in `scheduled-crawls.json` it crawls, compares against the previous crawl,
generates a technical audit, commits the reports to `reports/scheduled/<clientId>/`,
and refreshes the dashboard's live data. The orchestration runs via
`npm run weekly` (`scripts/weekly.ts`).

Configure sites in `scheduled-crawls.json` (a JSON array of
`{ clientId, url, maxPages?, maxDepth? }`); see `scheduled-crawls.example.json`.
It is empty by default, so the scheduled run is a no-op until you add sites.

- **Search Console sync** (`search-console-sync.ts`) — see `POST /api/cron/search-console`.

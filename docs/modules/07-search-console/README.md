# 07. Search Console Integration

**Status:** Implemented

Connect Google Search Console and store queries, pages, CTR, clicks,
impressions, position, and index coverage. Two complementary paths:

## App integration (TypeScript)

Connects a property via OAuth and persists analytics + coverage into the
database for the dashboards (`/clients/[clientId]`, internal dashboard).

- **Code:** `backend/*/search-console`, `src/app/api/search-console`,
  `src/app/api/cron/search-console`

## File-pipeline sync (Python `searchconsole/`)

A standalone sync that pulls a site's performance snapshot from the Search
Console API and writes `search-console.json`: site-wide **Clicks, Impressions,
CTR, Position**, plus **Top Queries** and **Top Pages** for a date range. It
mirrors the crawler/analyzer/generator/memory file pipeline — a live
service-account client (`GoogleSearchConsoleClient`) and an offline
`SampleSearchConsoleClient` behind one protocol, so the report builder is fully
testable without network or credentials.

A daily GitHub Actions workflow
(`.github/workflows/search-console-sync.yml`) runs the CLI and commits the
refreshed snapshot to `reports/search-console/`; it falls back to an offline
sample when credentials/site are not configured.

- **Code:** `searchconsole/sc_sync`, `searchconsole/run_sync.py`,
  `.github/workflows/search-console-sync.yml`
- **Docs:** [`../../../searchconsole/README.md`](../../../searchconsole/README.md)

- **Spec:** [`../../../PROJECT_SPEC.md`](../../../PROJECT_SPEC.md) → "Search Console Integration"

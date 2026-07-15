# crawler

Crawler subsystem configuration for the SEO OS.

The crawler **engine** (headless-Chromium fetcher, BFS URL discovery, DOM
extraction) follows Clean Architecture and lives under `backend/*/crawl`
(domain / application / infrastructure). This folder holds crawler **inputs**
that are data, not logic:

- `config/` — per-site crawl settings (start URL, max pages, depth)
- `profiles/` — extraction / render profiles (what to collect, JS rendering)

Runners live in `scripts/` (`npm run crawl`, `npm run weekly`); scheduled runs
live in `automations/`. See `docs/modules/06-seo-crawler`.

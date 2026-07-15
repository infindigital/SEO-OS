# 06. SEO Crawler

**Status:** Implemented

Crawl a site and collect per-page technical SEO data.

Two interchangeable engines emit the same `crawl.json` schema (`CrawlResult` /
`PageAudit`), so downstream analysis is engine-agnostic:

- **Version 1 — Crawl4AI + Playwright (Python)** at `crawler/` — headless
  Chromium via Crawl4AI, BFS same-host discovery, lxml SEO extraction. Run with
  `crawler/.venv/bin/python crawler/run_crawl.py <url> --out crawl.json`. See
  [`crawler/README.md`](../../../crawler/README.md) for setup.
- **TypeScript / Playwright** at `backend/*/crawl` (+ `scripts/crawl.ts`) —
  integrated with the analysis/audit/weekly pipeline.

Both collect: URL, status code, title, meta description, H1, H2, canonical,
meta robots, images (+ missing alt), internal/external links, word count,
JSON-LD schema types, response time (plus final URL, redirect chain, depth).
No analysis is performed by the crawler.

- **Spec:** [`../../../PROJECT_SPEC.md`](../../../PROJECT_SPEC.md) → "SEO Crawler"
- **Code:** `crawler/seo_crawler`, `backend/*/crawl`, `scripts/crawl.ts`

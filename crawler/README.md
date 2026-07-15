# crawler

The SEO crawler subsystem.

## Version 1 — Crawl4AI + Playwright (`seo_crawler/`)

A Python crawler built on [Crawl4AI](https://github.com/unclecode/crawl4ai)
(headless Chromium via Playwright). It discovers same-host pages breadth-first
and collects per-page technical SEO data, then writes `crawl.json`. **No
analysis is performed** — that is a separate stage.

### Collected per page

URL, status code, title, meta description, H1, H2, canonical, meta robots,
images (+ missing alt text), internal / external links, word count, JSON-LD
schema types, response time (plus final URL, redirect chain, and crawl depth).

The output schema matches the TypeScript crawler (`backend/*/crawl`) so either
engine's `crawl.json` feeds the same downstream analysis.

### Setup

```bash
python -m venv crawler/.venv
crawler/.venv/bin/pip install -r crawler/requirements.txt
crawler/.venv/bin/playwright install chromium
```

### Run

```bash
crawler/.venv/bin/python crawler/run_crawl.py https://example.com \
  --max-pages 50 --max-depth 2 --out crawl.json
```

### Test

```bash
crawler/.venv/bin/python -m pytest crawler/tests
```

### Layout

- `seo_crawler/extract.py` — pure HTML → SEO field extraction (lxml)
- `seo_crawler/crawler.py` — BFS discovery + Crawl4AI fetch orchestration
- `seo_crawler/models.py` — serializable result models (`crawl.json` shape)
- `run_crawl.py` — CLI entrypoint
- `tests/` — unit tests for the extraction logic

## Inputs (data, not logic)

- `config/` — per-site crawl settings (start URL, max pages, depth)
- `profiles/` — extraction / render profiles (what to collect, JS rendering)

The earlier TypeScript crawler engine still lives under `backend/*/crawl`; see
`docs/modules/06-seo-crawler`.

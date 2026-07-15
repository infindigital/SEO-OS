# analyzer

Technical SEO analyzer. Reads a `crawl.json` (from the crawler) and writes a
rule-based technical SEO audit to `audit.json`. **Pure and deterministic** — no
AI, no network, no browser, and no third-party dependencies (stdlib only).

## Generated categories

| Category | Severity | Rule |
|---|---|---|
| `404Errors` | error | Page returned HTTP 404 |
| `redirectChains` | warning | Page reached via ≥1 redirect hop |
| `missingTitles` | warning | Indexable page with no `<title>` |
| `missingDescriptions` | warning | Indexable page with no meta description |
| `duplicateTitles` | warning | Same title on >1 indexable page |
| `duplicateDescriptions` | warning | Same meta description on >1 indexable page |
| `missingH1` | warning | Indexable page with no H1 |
| `brokenLinks` | error | Internal link to a page that returned ≥400 |
| `missingCanonicals` | warning | Indexable page with no canonical |
| `missingAltText` | notice | Page with ≥1 image missing alt text |
| `thinContent` | warning | Indexable page below the word-count threshold |

"Indexable" = HTTP 2xx and not `noindex`. Thresholds (thin-content word count,
redirect-chain min hops) live in `seo_analyzer/thresholds.py` and mirror the
TypeScript analyzer's defaults.

## Run

```bash
python3 analyzer/run_analyze.py crawl.json --out audit.json
```

The full pipeline (from the crawler):

```bash
crawler/.venv/bin/python crawler/run_crawl.py https://example.com --out crawl.json
python3 analyzer/run_analyze.py crawl.json --out audit.json
```

## Test

```bash
python3 -m pytest analyzer/tests
```

## Layout

- `seo_analyzer/analyze.py` — pure `analyze_crawl(crawl) -> audit` rules
- `seo_analyzer/thresholds.py` — tunable thresholds
- `run_analyze.py` — CLI entrypoint
- `tests/` — unit tests per category

`audit.json` shape: `source`, `generatedAt`, `thresholds`, `summary`
(`totalPages`, `totalIssues`, `byCategory`, `bySeverity`), and `categories`
(the 11 lists above). See `docs/modules/09-technical-audit`.

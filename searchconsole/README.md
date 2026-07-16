# searchconsole/ — Google Search Console sync

Pulls a site's search-performance snapshot from the [Google Search Console
API](https://developers.google.com/webmaster-tools/search-console-api-original)
and writes it to `search-console.json`.

Stored metrics (Task 12): **Clicks, Impressions, CTR, Position** (site-wide),
plus **Top Queries** and **Top Pages** for a date range.

## Layout

```
searchconsole/
  sc_sync/
    models.py   # search-console.json data shape (AnalyticsRow, Totals, Report)
    client.py   # GoogleSearchConsoleClient (live) + SampleSearchConsoleClient (offline)
    report.py   # build_report(): totals + top queries + top pages
    dates.py    # default_range(): the reporting window
  run_sync.py   # CLI entrypoint
  requirements.txt
  tests/
```

The report builder depends only on the `SearchConsoleClient` protocol
(`query(...) -> list[dict]`), so it runs against the live API or the offline
sample identically. Live credentials are supplied via dependency injection and
the Google client libraries are imported lazily — the package, its tests, and
`--sample` runs need no third-party packages.

## Output shape — `search-console.json`

```json
{
  "site": "https://example.com/",
  "range": { "startDate": "2026-06-18", "endDate": "2026-07-15" },
  "generatedAt": "2026-07-16T05:00:00+00:00",
  "totals": { "clicks": 1820, "impressions": 45230, "ctr": 0.0402, "position": 12.4 },
  "topQueries": [
    { "query": "seo audit tool", "clicks": 412, "impressions": 6100, "ctr": 0.0675, "position": 4.2 }
  ],
  "topPages": [
    { "page": "https://example.com/blog/seo-audit", "clicks": 540, "impressions": 8200, "ctr": 0.0659, "position": 5.0 }
  ]
}
```

`ctr` is a 0–1 fraction rounded to 4 decimals; `position` is rounded to 1
decimal. Both are rounded so committed snapshots diff cleanly.

## Usage

Offline sample (no credentials, deterministic — good for a smoke test):

```bash
python searchconsole/run_sync.py "https://example.com/" --sample
```

Live sync (service-account credentials):

```bash
python -m venv searchconsole/.venv
searchconsole/.venv/bin/pip install -r searchconsole/requirements.txt
searchconsole/.venv/bin/python searchconsole/run_sync.py \
  "https://example.com/" --credentials service-account.json --days 28 \
  --out search-console.json
```

The `site` argument is a Search Console property — a URL-prefix property
(`https://example.com/`) or a Domain property (`sc-domain:example.com`).

### Options

| Flag | Default | Meaning |
| --- | --- | --- |
| `--credentials PATH` | — | Google service-account JSON key (required unless `--sample`). |
| `--sample` | off | Use the offline sample client instead of the live API. |
| `--start` / `--end` | — | Explicit `YYYY-MM-DD` window (both or neither). |
| `--days N` | `28` | Window length when `--start`/`--end` are omitted. |
| `--lag N` | `3` | Days skipped at the end for unfinalized data. |
| `--row-limit N` | `10` | Number of Top Queries and Top Pages to keep. |
| `--out PATH` | `search-console.json` | Output file. |

## Authentication (live runs)

1. In Google Cloud, create a **service account** and download its JSON key.
2. Enable the **Google Search Console API** for the project.
3. In Search Console → *Settings → Users and permissions*, add the service
   account's email as a user of the property (Restricted access is enough — the
   sync only reads).
4. Pass the JSON key path via `--credentials`.

The sync requests only the read-only scope
`https://www.googleapis.com/auth/webmasters.readonly`.

## Scheduled sync

`.github/workflows/search-console-sync.yml` runs the CLI on a daily cron (and
on demand via *workflow_dispatch*) and commits the refreshed
`search-console.json` back to the repository. The service-account key is read
from the `GSC_CREDENTIALS_JSON` secret; the property is set by the `GSC_SITE`
variable (or the dispatch input). Without those configured, the workflow falls
back to an offline `--sample` snapshot so it never fails hard.

## Tests

```bash
python3 -m pytest searchconsole/tests
```

No third-party packages required — the tests exercise the models, the report
builder (via `SampleSearchConsoleClient`), the date window, and the live
client's request shaping with an injected fake service.

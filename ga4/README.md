# ga4/ — Google Analytics 4 sync

Pulls a GA4 property's traffic snapshot from the [GA4 Data
API](https://developers.google.com/analytics/devguides/reporting/data/v1) and
writes it to `ga4.json`.

Stored metrics (Task 13): **Users, Sessions, Conversions** (site-wide totals),
plus **Top Pages** and **Events** for a date range.

## Layout

```
ga4/
  ga4_sync/
    models.py   # ga4.json data shape (Totals, PageRow, EventRow, Report)
    client.py   # GoogleAnalyticsClient (live) + SampleAnalyticsClient (offline)
    report.py   # build_report(): totals + top pages + events
    dates.py    # default_range(): the reporting window
  run_sync.py   # CLI entrypoint
  requirements.txt
  tests/
```

The report builder depends only on the `AnalyticsClient` protocol
(`run_report(...) -> list[dict]`), so it runs against the live API or the
offline sample identically. Live credentials are supplied via dependency
injection and the Google auth libraries are imported lazily — the package, its
tests, and `--sample` runs need no third-party packages.

## Output shape — `ga4.json`

```json
{
  "property": "properties/123456789",
  "range": { "startDate": "2026-06-18", "endDate": "2026-07-15" },
  "generatedAt": "2026-07-16T05:00:00+00:00",
  "totals": { "users": 8421, "sessions": 11200, "conversions": 342, "events": 53100 },
  "topPages": [
    { "page": "/", "views": 9800, "users": 5400, "sessions": 6200 }
  ],
  "events": [
    { "event": "page_view", "count": 24800, "users": 8200 }
  ]
}
```

Top Pages are ranked by `views`; Events by `count`. `conversions` renders as an
integer when whole and keeps two decimals otherwise (GA4 attribution can be
fractional).

## Usage

Offline sample (no credentials, deterministic — good for a smoke test):

```bash
python ga4/run_sync.py 123456789 --sample
```

Live sync (service-account credentials):

```bash
python -m venv ga4/.venv
ga4/.venv/bin/pip install -r ga4/requirements.txt
ga4/.venv/bin/python ga4/run_sync.py 123456789 \
  --credentials service-account.json --days 28 --out ga4.json
```

The `property` argument is a GA4 property id (`123456789` or
`properties/123456789`).

### Options

| Flag | Default | Meaning |
| --- | --- | --- |
| `--credentials PATH` | — | Google service-account JSON key (required unless `--sample`). |
| `--sample` | off | Use the offline sample client instead of the live API. |
| `--start` / `--end` | — | Explicit `YYYY-MM-DD` window (both or neither). |
| `--days N` | `28` | Window length when `--start`/`--end` are omitted. |
| `--lag N` | `1` | Days skipped at the end (GA4 is near real-time; ends yesterday). |
| `--row-limit N` | `10` | Number of Top Pages and Events to keep. |
| `--out PATH` | `ga4.json` | Output file. |

## Authentication (live runs)

1. In Google Cloud, create a **service account** and download its JSON key.
2. Enable the **Google Analytics Data API** for the project.
3. In GA4 → *Admin → Property → Property access management*, add the service
   account's email with the **Viewer** role.
4. Pass the JSON key path via `--credentials`.

The sync requests only the read-only scope
`https://www.googleapis.com/auth/analytics.readonly`.

## Scheduled sync

`.github/workflows/analytics-sync.yml` runs the CLI on a daily cron (and on
demand via *workflow_dispatch*) and commits the refreshed `ga4.json` back to the
repository. The service-account key is read from the `GA4_CREDENTIALS_JSON`
secret; the property is set by the `GA4_PROPERTY_ID` variable (or the dispatch
input). Without those configured, the workflow falls back to an offline
`--sample` snapshot so it never fails hard.

## Tests

```bash
python3 -m pytest ga4/tests
```

No third-party packages required — the tests exercise the models, the report
builder (via `SampleAnalyticsClient`), the date window, and the live client's
request shaping with an injected fake session.

# 08. Google Analytics Integration

**Status:** Implemented

Ingest GA4 traffic, engagement, and conversions.

## File-pipeline sync (Python `ga4/`)

A standalone sync that pulls a GA4 property's traffic snapshot from the GA4 Data
API (`runReport`) and writes `ga4.json`: site-wide **Users, Sessions,
Conversions** and Events totals, plus **Top Pages** (by views) and **Events**
(by count) for a date range. It mirrors the crawler/analyzer/generator/memory
and Search Console file pipeline — a live service-account client
(`GoogleAnalyticsClient`) and an offline `SampleAnalyticsClient` behind one
protocol, so the report builder is fully testable without network or
credentials.

A daily GitHub Actions workflow (`.github/workflows/analytics-sync.yml`) runs
the CLI and commits the refreshed snapshot to `reports/ga4/`; it falls back to
an offline sample when credentials/property are not configured.

- **Code:** `ga4/ga4_sync`, `ga4/run_sync.py`,
  `.github/workflows/analytics-sync.yml`
- **Docs:** [`../../../ga4/README.md`](../../../ga4/README.md)

- **Spec:** [`../../../PROJECT_SPEC.md`](../../../PROJECT_SPEC.md) → "Google Analytics Integration"

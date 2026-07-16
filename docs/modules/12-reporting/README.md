# 12. Reporting

**Status:** Implemented

Package crawls, audits, and analytics into shareable reports.

## Monthly client report (Python `reporting/`)

Assembles the file-pipeline artifacts — GA4 (`ga4.json`), Search Console
(`search-console.json`) and the technical audit (`audit.json`) — plus completed
work and a roadmap into a **seven-section** monthly client report and exports it
as **Markdown** and **PDF**:

Executive Summary · SEO Progress · Completed Work · Traffic Growth · Keyword
Growth · Developer Progress · Next Month Roadmap.

Growth is shown by comparing each source to an optional previous-period
snapshot. The Executive Summary is written by Claude when `ANTHROPIC_API_KEY` is
set and by a deterministic fallback otherwise. PDF export uses `fpdf2` (pure
Python, imported lazily); Markdown needs no third-party packages.

- **Code:** `reporting/monthly_report`, `reporting/run_report.py`
- **Docs:** [`../../../reporting/README.md`](../../../reporting/README.md)

## Underlying report storage

- **Code:** `backend/infrastructure/audit`, `reports/`, `templates/reports`

- **Spec:** [`../../../PROJECT_SPEC.md`](../../../PROJECT_SPEC.md) → "Reporting"

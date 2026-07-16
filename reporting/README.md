# reporting/ — Monthly client report generator

Assembles the file-pipeline artifacts (GA4, Search Console, the technical
audit) plus completed work and a roadmap into a **seven-section monthly client
report** and exports it as **Markdown** and **PDF**.

Sections (Task 14): Executive Summary · SEO Progress · Completed Work · Traffic
Growth · Keyword Growth · Developer Progress · Next Month Roadmap.

## Layout

```
reporting/
  monthly_report/
    models.py    # report data shape (7 sections + MetricDelta growth)
    sources.py   # ReportInputs + loaders for ga4.json / search-console.json / audit.json
    build.py     # build_report(): assembles the seven sections with growth deltas
    narrator.py  # Executive Summary — rule-based, or Claude with fallback
    format.py    # shared ASCII-safe number/delta formatting
    render.py    # Markdown export
    pdf.py       # PDF export (fpdf2, lazy import)
  run_report.py  # CLI entrypoint
  requirements.txt
  sample/        # a self-contained config + artifacts for `--sample`
  tests/
```

Growth is computed by comparing the current snapshot to an optional `previous`
one for each source (traffic, keywords, SEO issues, score). Every source is
optional — a missing artifact renders as a *not connected* section rather than
failing, so a report can always be produced.

## Usage

Self-contained sample (uses `sample/report-config.json` and its artifacts):

```bash
python -m venv reporting/.venv
reporting/.venv/bin/pip install -r reporting/requirements.txt
reporting/.venv/bin/python reporting/run_report.py --sample \
  --md report.md --pdf report.pdf
```

Real run against your own config:

```bash
python reporting/run_report.py config.json --md report.md --pdf report.pdf
```

Markdown export needs no third-party packages; `fpdf2` is required only for
PDF. Skip either with `--no-pdf` / `--no-md`.

### Config shape

Paths are resolved relative to the config file's directory (override with
`--base`):

```json
{
  "client": "Acme Corp",
  "website": "https://acme.com/",
  "period": "July 2026",
  "seoScore": 78, "seoScorePrevious": 71,
  "ga4": "ga4.json", "ga4Previous": "ga4-prev.json",
  "searchConsole": "search-console.json",
  "searchConsolePrevious": "search-console-prev.json",
  "audit": "audit.json", "auditPrevious": "audit-prev.json",
  "openTasks": 4,
  "completedWork": [
    { "title": "Fixed 404 errors", "detail": "12 URLs", "completedAt": "2026-07-08" }
  ],
  "roadmap": [
    { "title": "Improve Core Web Vitals", "detail": "LCP < 2.5s" }
  ]
}
```

`ga4` / `searchConsole` / `audit` are the outputs of the `ga4/`,
`searchconsole/` and `analyzer/` pipelines respectively; the `*Previous`
variants are the prior period's snapshots (kept e.g. under
`reports/ga4/` and `reports/search-console/`).

### Executive Summary

The prose summary is written by Claude when `ANTHROPIC_API_KEY` is set (install
the optional `anthropic` SDK), and by a deterministic, offline fallback
otherwise — so the report always generates. Both narrators work from the same
computed numbers and never invent figures.

## Tests

```bash
python3 -m pytest reporting/tests
```

The tests exercise the growth deltas, section assembly (including missing
analytics), the rule-based narrator, the Markdown render (headings in order,
deltas present), and PDF export (valid `%PDF` document, Latin-1 safety).

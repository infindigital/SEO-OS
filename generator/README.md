# generator

The AI audit generator. Reads an `audit.json` (from the analyzer) and produces
two Markdown deliverables:

- **`technical-audit.md`** — executive summary, overview, and per-issue findings
  with business and SEO impact.
- **`developer-tasks.md`** — prioritized, actionable tasks, each with:
  Technical Audit, Business Impact, SEO Impact, Recommended Fix, Priority,
  Estimated Time, and Acceptance Criteria.

## How it works

- **Structured fields** (impacts, fixes, priority, effort, acceptance criteria)
  come from a curated SEO knowledge base (`seo_audit_gen/knowledge.py`) —
  deterministic and reviewed, never hallucinated. One prioritized task is
  generated per issue category present in the audit; effort scales with the
  number of affected pages.
- **The executive summary** is written by a pluggable narrator:
  - `RuleBasedNarrator` — deterministic, offline, always available (the default).
  - `ClaudeNarrator` — a Claude-written summary (model `claude-opus-4-8`), used
    automatically when `ANTHROPIC_API_KEY` is set and the `anthropic` SDK is
    installed. Falls back to the rule-based summary on any error.

## Run

Stdlib only (rule-based summary):

```bash
python3 generator/run_generate.py audit.json --out-dir .
```

With Claude-written summary:

```bash
pip install -r generator/requirements.txt
export ANTHROPIC_API_KEY=sk-ant-...
python3 generator/run_generate.py audit.json --out-dir reports/
```

The full pipeline (from the crawler):

```bash
crawler/.venv/bin/python crawler/run_crawl.py https://example.com --out crawl.json
python3 analyzer/run_analyze.py crawl.json --out audit.json
python3 generator/run_generate.py audit.json --out-dir .
```

## Test

```bash
python3 -m pytest generator/tests
```

## Layout

- `seo_audit_gen/knowledge.py` — per-category SEO knowledge base
- `seo_audit_gen/generate.py` — audit.json → prioritized `DeveloperTask`s
- `seo_audit_gen/narrator.py` — rule-based + Claude executive-summary narrators
- `seo_audit_gen/render.py` — Markdown renderers
- `run_generate.py` — CLI entrypoint
- `tests/` — unit tests

See `docs/modules/09-technical-audit`.

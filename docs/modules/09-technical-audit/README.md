# 09. Technical SEO Audit

**Status:** Implemented

Analyze crawls, generate prioritized tasks, compare over time.

## Analyzers

Two interchangeable analyzers turn a `crawl.json` into a technical SEO audit:

- **Python** at `analyzer/` — reads `crawl.json`, writes `audit.json` with 11
  issue categories (404 errors, redirect chains, missing/duplicate titles &
  descriptions, missing H1, broken links, missing canonicals, missing alt text,
  thin content). Pure stdlib, deterministic, no browser. Pairs with the Python
  crawler: `python3 analyzer/run_analyze.py crawl.json --out audit.json`. See
  [`analyzer/README.md`](../../../analyzer/README.md).
- **TypeScript** at `backend/*/analysis` (+ `scripts/analyze.ts`) — integrated
  with task generation, comparison, and client memory.

- **Spec:** [`../../../PROJECT_SPEC.md`](../../../PROJECT_SPEC.md) → "Technical SEO Audit"
- **Code:** `analyzer/seo_analyzer`, `backend/*/{analysis,audit,comparison,client-memory}`, `scripts/{analyze,audit,track}.ts`

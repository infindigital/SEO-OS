# agents/definitions

Agent definitions: role, responsibilities, rules, SOP, and output format for
each agent.

## The roster

Eight agents power the SEO OS. Each has a canonical Markdown definition in this
directory, and is enumerated in [`manifest.json`](./manifest.json) for
programmatic discovery.

| Agent | ID | Purpose |
| --- | --- | --- |
| SEO Director | `seo-director` | Owns strategy; orchestrates the specialists. |
| Technical SEO | `technical-seo` | Crawl/index/CWV fixes → developer tasks. |
| Content Strategist | `content-strategist` | Search demand → content plan & briefs. |
| Local SEO | `local-seo` | Local pack, GBP, citations, reviews. |
| Link Building | `link-building` | Prospecting & white-hat outreach. |
| Reporting | `reporting` | Client-safe monthly report (MD + PDF). |
| QA | `qa` | Verifies every deliverable before it ships. |
| Developer Reviewer | `developer-reviewer` | Reviews task implementation vs. acceptance criteria. |

## Definition format

Every `<id>.md` follows the same five-section contract (the section order is
also declared in `manifest.json` as `sectionOrder`):

1. **Role** — what the agent is and its scope.
2. **Responsibilities** — the concrete work it owns.
3. **Rules** — the guardrails it must never break.
4. **SOP** — the numbered standard operating procedure it follows.
5. **Output Format** — the exact shape of what it returns.

Two rules are shared by every agent and enforced throughout the definitions:

- **Memory first.** Load `clients/<id>/memory.md` before making any
  recommendation, and never re-recommend completed work.
- **Client-safe boundary.** Only the Reporting agent's output reaches the
  client, and it never carries raw diagnostics, task internals, or tooling
  detail.

## manifest.json

A machine-readable index consumed by the application layer. Each entry carries:

- `id`, `name`, `role` — identity and one-line purpose.
- `definition` — the Markdown file in this directory.
- `reasoning` — effort tier (`high` for strategy/verification agents,
  `standard` otherwise).
- `orchestrator` — `true` only for the SEO Director.
- `collaboratesWith` — other agent ids it hands work to or from.
- `consumes` / `produces` — the pipeline artifacts it reads and the outputs it
  creates, tying each agent to the file pipeline (`crawl.json`, `audit.json`,
  `search-console.json`, `ga4.json`, `memory.md`, `report.md`/`report.pdf`).

`tests/test_definitions.py` validates that the manifest and the Markdown files
stay in sync (every agent has a file with all five sections, ids are unique,
and every collaborator reference resolves).

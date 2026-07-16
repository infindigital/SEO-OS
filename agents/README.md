# agents

AI agent definitions that power the SEO OS. Each agent encapsulates a role
(strategy, technical, content, local, links, reporting, QA, review) with its
responsibilities, rules, standard operating procedure, and output format.

Agents are consumed by the application layer in `backend/` and surfaced through
the dashboard. Model-provider adapters and prompt assembly live alongside the
agent definitions here.

## Layout

- **`definitions/`** — the eight canonical agent definitions (one Markdown file
  each) plus `manifest.json`, the machine-readable index. Start here:
  [`definitions/README.md`](./definitions/README.md).
- **`prompts/`** — prompt templates and system messages (data, not code).
- **`tools/`** — tool definitions agents can call, wrapping `backend/` use
  cases.

## The eight agents

SEO Director (orchestrator) · Technical SEO · Content Strategist · Local SEO ·
Link Building · Reporting · QA · Developer Reviewer.

The SEO Director sets strategy and delegates to the specialists; QA and the
Developer Reviewer verify deliverables and implementation; the Reporting agent
is the only one whose output reaches the client. Every agent loads client
memory before recommending and never re-recommends completed work.

## Tests

```bash
python3 -m pytest agents/tests
```

Validates that `definitions/manifest.json` and the Markdown definitions stay in
sync — every agent has a file containing all five required sections, ids are
unique, and every collaborator reference resolves.

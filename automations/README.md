# automations

Scheduled and event-driven workflows: recurring audits, rank-tracking pulls,
report generation, and agent pipelines that run without a human in the loop.

Automations are thin orchestrators — they invoke application use cases from
`backend/`. Scheduling definitions (cron expressions, triggers) and workflow
composition live here. Imported via the `@automations/*` path alias.

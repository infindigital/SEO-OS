# Data model

The database is PostgreSQL (Supabase) accessed via Prisma. The schema is
[`../../prisma/schema.prisma`](../../prisma/schema.prisma); per-module tables are
documented in [`../../PROJECT_SPEC.md`](../../PROJECT_SPEC.md).

**Implemented tables:** `profiles`, `clients`, `daily_metrics`,
`search_console_connections`, `search_analytics_rows`, `page_coverage`.

**Planned tables (per module):** `seo_tasks`, `crawls`, `crawl_pages`, `audits`,
`audit_issues`, `analytics_connections`, `analytics_metrics`, `content_items`,
`content_briefs`, `keywords`, `ai_prompts`, `ai_visibility_checks`,
`ai_visibility_scores`, `reports`, `notifications`, `notification_preferences`,
`automation_jobs`.

Migrations live in `prisma/migrations/`.

# Infin Digital SEO OS — Project Specification

## Project Name

**Infin Digital SEO OS**

## Description

An AI-powered SEO Operating System for agencies. It gives an agency a single
platform to onboard clients, crawl and audit their websites, ingest Search
Console and Analytics data, plan content, track AI/LLM visibility, generate
prioritized developer tasks, and deliver automated reporting — with role-based
dashboards for the agency team, developers, and clients.

## Architecture Overview

- **Framework:** Next.js (App Router) + React + TypeScript (strict)
- **Styling / UI:** Tailwind CSS + shadcn/ui, Recharts for charts
- **Auth:** Supabase Auth (email/password); roles stored in the `profiles` table
- **Database:** PostgreSQL (Supabase) via Prisma
- **Design:** Modular monolith following **Clean Architecture** — `backend/`
  split into `domain` / `application` / `infrastructure` / `interface`; the
  Next.js app and CLI scripts are the delivery layer
- **Background/CLI:** Playwright crawler + analysis/audit/tracking pipeline run
  as CLI scripts and via GitHub Actions
- **Packaging/CI:** Docker (standalone) + GitHub Actions

Module implementation status is noted per module as **Implemented**, **Partial**,
or **Planned**.

---

## Users & Roles

| Role | Description | Scope |
| --- | --- | --- |
| **Super Admin** | Agency owner / platform admin | Everything: users, billing, all clients, settings |
| **SEO Manager** | Owns client strategy and delivery | All clients they manage, task assignment, content approval, reports |
| **SEO Executive** | Executes SEO work | Assigned clients: crawls, audits, content drafting, task execution |
| **Developer** | Implements technical fixes | Developer dashboard, technical tasks across assigned clients |
| **Client** | External customer | Read-only access to their own dashboard and reports |

**Role model (current):** the implemented system uses `ADMIN`, `DEVELOPER`,
`CLIENT`. This spec expands staff roles into `SUPER_ADMIN`, `SEO_MANAGER`,
`SEO_EXECUTIVE` (mapping onto the "staff" concept), plus `DEVELOPER` and
`CLIENT`. Authorization is enforced in middleware (coarse gate) and in
server-side guards (`requireRole`) and server actions (defense in depth).

**Permissions matrix (high level):**

| Capability | Super Admin | SEO Manager | SEO Executive | Developer | Client |
| --- | :-: | :-: | :-: | :-: | :-: |
| Manage users & roles | ✅ | — | — | — | — |
| Manage clients | ✅ | ✅ | ✅ (assigned) | — | — |
| Run crawls / audits | ✅ | ✅ | ✅ | — | — |
| Technical tasks | ✅ | ✅ | — | ✅ | — |
| Content planning | ✅ | ✅ | ✅ | — | — |
| View agency dashboard | ✅ | ✅ | ✅ | ✅ | — |
| View own client dashboard | ✅ | ✅ | ✅ | ✅ | ✅ (own) |
| Configure automation | ✅ | ✅ | — | — | — |

---

## Module 1 — Authentication

**Status:** Implemented

### Purpose
Securely authenticate users and enforce role-based access across the platform.

### Features
- Email/password sign-up, sign-in, sign-out via Supabase Auth
- Role assignment on registration (admin bootstrap via configured emails;
  default `CLIENT`)
- Server-side session guards + Edge middleware with default-deny route
  protection and redirect-to-login
- Admin user management: list users, change roles
- Session refresh; forbidden (403) page for insufficient roles

### Database Tables
- `profiles` — `id` (= Supabase auth user id), `email`, `role`, `created_at`,
  `updated_at`
- (Auth users themselves live in Supabase `auth.users`)

### API Endpoints
- Server actions: `signInAction`, `signUpAction`, `signOutAction`
- Server action: `updateUserRoleAction` (admin)
- `middleware.ts` (session refresh + route protection)

### UI Components
- `/login`, `/signup` pages with react-hook-form + zod forms
- Dashboard `UserMenu` (email, role badge, sign out)
- `/admin` users table with role selector
- `/forbidden` (403) page, role-aware `MainNav`

### Future Enhancements
- OAuth/SSO (Google Workspace), magic links, MFA/TOTP
- Full 5-role model (`SUPER_ADMIN` / `SEO_MANAGER` / `SEO_EXECUTIVE`)
- Team/agency multi-tenancy, per-client user assignment
- Audit log of auth events; password reset & email verification flows
- Row-Level Security policies; refresh-token encryption at rest

---

## Module 2 — Client Management

**Status:** Implemented

### Purpose
Onboard and manage the agency's clients and their core details.

### Features
- Create, edit, delete clients
- Search clients (name, website, contact) and filter by status
- Client lifecycle status (Prospect → Onboarding → Active → Paused → Churned)
- Validation of name, website URL, and contact email at the domain layer

### Database Tables
- `clients` — `id`, `name`, `website`, `contact_name`, `contact_email`,
  `status` (enum `ClientStatus`), `notes`, `created_at`, `updated_at`

### API Endpoints
- Server actions: `createClientAction`, `updateClientAction`,
  `deleteClientAction`
- Read: server components query the `ListClients` / client dashboard use cases

### UI Components
- `/clients` table with debounced search + status filter
- Add/Edit dialog (react-hook-form + zod), delete confirmation
- Status badge; client name links to the Client Dashboard

### Future Enhancements
- Per-client team assignment and access scoping
- Contacts sub-entity (multiple stakeholders), contracts/SLA fields
- Onboarding checklist, tags/segments, activity log
- Client-level settings (target keywords, competitors, locales)

---

## Module 3 — Internal Dashboard (Agency / Internal)

**Status:** Partial

### Purpose
Give agency staff an at-a-glance operational view: portfolio health, headline
metrics, and drill-down into any client.

### Features
- **Agency dashboard:** portfolio of all clients with Search Console
  clicks/impressions/CTR and agency totals; links to each client
- **Metrics overview:** traffic, SEO score, open tasks, developer progress,
  content progress (cards + charts)
- Role-aware navigation (staff-only)

### Database Tables
- `daily_metrics` — `date`, `organic_traffic`, `seo_score`, `open_tasks`,
  `developer_progress`, `content_progress`
- Reads across `clients`, `search_console_connections`, `search_analytics_rows`,
  `page_coverage`

### API Endpoints
- Server components via use cases: `GetAgencyOverview`, `GetDashboardOverview`
- (Read-only; no mutation endpoints)

### UI Components
- `/agency` portfolio table + KPI stat cards
- `/dashboard` metrics cards: `TrafficChart` (area), `MetricGauge` (radial),
  `TasksSparkline`, `TrendBadge`

### Future Enhancements
- Aggregate open-issue and task rollups sourced from crawl/audit data
- Portfolio alerts (traffic drops, coverage regressions), saved views
- Date-range selectors, comparison periods, export

---

## Module 4 — Developer Dashboard

**Status:** Planned

### Purpose
Give developers a focused queue of technical SEO tasks (from audits) with the
context needed to implement fixes and track progress.

### Features
- Task queue filtered to technical/development category and to the current
  developer's assignments
- Grouping by client, priority, and status; per-task detail (recommended fix,
  acceptance criteria, affected URLs, estimate)
- Status transitions (Todo → In Progress → In Review → Done)
- Developer progress rollup feeding the internal dashboard

### Database Tables
- `seo_tasks` (planned) — `id`, `client_id`, `source` (audit/manual),
  `issue_type`, `title`, `description`, `category`, `priority`, `status`,
  `assignee_id`, `estimated_minutes`, `affected_urls` (jsonb), `created_at`,
  `updated_at`
- Reads `profiles` (assignee), `clients`

### API Endpoints
- `GET /api/tasks?assignee=me&category=development&status=...`
- Server actions: `updateTaskStatusAction`, `assignTaskAction`,
  `addTaskCommentAction`

### UI Components
- `/developer` board/list with filters, priority + status badges
- Task detail drawer (fix, acceptance criteria, URLs, estimate)
- "My tasks" summary cards

### Future Enhancements
- Sync tasks to GitHub Issues / Jira; PR links on tasks
- Effort burndown, SLA timers, task dependencies
- Code-snippet suggestions and diff previews per fix

---

## Module 5 — Client Dashboard

**Status:** Implemented (SEO performance); Partial overall

### Purpose
Give clients a clear, read-only view of their SEO performance and progress.

### Features
- Search Console performance: total clicks, impressions, CTR, avg position
- Top queries and top pages tables
- Index coverage breakdown by state
- Connection status and last-synced time; empty state when not connected

### Database Tables
- Reads `search_console_connections`, `search_analytics_rows`, `page_coverage`,
  `clients`

### API Endpoints
- Server component via use case: `GetClientDashboard(clientId)`

### UI Components
- `/clients/[clientId]` — KPI stat cards, top queries/pages tables, coverage
  breakdown, breadcrumb back to Agency

### Future Enhancements
- Client-facing report downloads, commentary/annotations
- Trend charts over time, goal tracking, competitor benchmarks
- Client login scoped strictly to their own workspace
- Analytics (GA4) and content-progress panels

---

## Module 6 — SEO Crawler

**Status:** Implemented

### Purpose
Crawl a client website, discover URLs, and collect per-page technical SEO data.

### Features
- Playwright (headless Chromium) crawl with `maxPages` / `maxDepth`, same-host
  discovery (BFS)
- Per page: status code, response time, title, meta description, canonical,
  meta robots, H1/H2, image count + missing-alt, word count, JSON-LD schema
  types, internal/external links, redirect chain, image byte sizes
- Saves the crawl as JSON (CLI); reusable via the application layer

### Database Tables
- File-based today (`reports/crawl-*.json`)
- Planned: `crawls` — `id`, `client_id`, `start_url`, `started_at`,
  `finished_at`, `page_count`, `options` (jsonb), `summary` (jsonb)
- Planned: `crawl_pages` — `crawl_id`, `url`, `status_code`, `title`, … (per-page)

### API Endpoints
- CLI: `npm run crawl -- <url> [--max-pages] [--max-depth]`
- Planned: `POST /api/clients/[clientId]/crawls` (enqueue a crawl)

### UI Components
- CLI + JSON output today
- Planned: crawl trigger + progress UI, page-level explorer table

### Future Enhancements
- Persist crawls to the DB; queue/worker for large sites; concurrency
- robots.txt / sitemap.xml awareness, JS-render toggles, scheduling per client
- Diffing pages across crawls; screenshot capture

---

## Module 7 — Search Console Integration

**Status:** Implemented

### Purpose
Connect a client's Google Search Console property and store its performance and
index-coverage data, kept up to date automatically.

### Features
- OAuth 2.0 connect flow (consent → callback stores refresh token)
- Sync query and page analytics (clicks, impressions, CTR, position) per day
- Index coverage for top pages via the URL Inspection API
- Automatic daily sync via a protected cron endpoint

### Database Tables
- `search_console_connections` — `id`, `client_id`, `site_url`,
  `refresh_token`, `status`, `last_synced_at`
- `search_analytics_rows` — `connection_id`, `dimension` (QUERY/PAGE),
  `key_value`, `date`, `clicks`, `impressions`, `ctr`, `position`
- `page_coverage` — `connection_id`, `page`, `coverage_state`, `verdict`,
  `last_crawled_at`, `fetched_at`

### API Endpoints
- `GET /api/search-console/connect?clientId=&siteUrl=` (start OAuth)
- `GET /api/search-console/callback` (store tokens)
- `POST /api/cron/search-console` (scheduled sync; `CRON_SECRET`)

### UI Components
- "Connect Search Console" entry point (staff)
- Client Dashboard consumes the stored data (queries/pages/coverage)

### Future Enhancements
- Sitemaps API, multiple properties per client, historical backfill
- Encrypt refresh tokens at rest; token-revocation handling
- Anomaly detection on clicks/impressions

---

## Module 8 — Google Analytics Integration

**Status:** Planned

### Purpose
Ingest GA4 traffic, engagement, and conversion data to complement Search
Console and give a fuller picture of organic performance.

### Features
- OAuth connect to a GA4 property
- Pull sessions, users, engagement rate, conversions by channel/landing page
- Attribute organic traffic; blend with Search Console in dashboards

### Database Tables
- `analytics_connections` — `client_id`, `property_id`, `refresh_token`,
  `status`, `last_synced_at`
- `analytics_metrics` — `connection_id`, `date`, `dimension`, `key_value`,
  `sessions`, `users`, `engagement_rate`, `conversions`

### API Endpoints
- `GET /api/analytics/connect?clientId=&propertyId=`
- `GET /api/analytics/callback`
- `POST /api/cron/analytics` (scheduled sync)

### UI Components
- "Connect Analytics" entry point
- Traffic & conversions panels on client and internal dashboards

### Future Enhancements
- Goal/funnel visualization, revenue attribution
- Looker-style custom report builder; segment comparisons

---

## Module 9 — Technical SEO Audit

**Status:** Implemented

### Purpose
Turn crawl data into a prioritized, actionable technical audit with developer
tasks.

### Features
- Rule-based analyzer detecting: HTTP errors (404), redirect chains, duplicate
  titles/descriptions, missing H1, thin content, broken links, missing
  canonicals, large images, missing alt
- Audit generator (remediation playbook): one task per issue type with priority,
  business impact, SEO impact, recommended fix, estimated time, acceptance
  criteria
- Crawl-over-crawl comparison: new / resolved / remaining issues + improvement
  score; per-client memory/history
- Outputs Markdown + JSON

### Database Tables
- File-based today (`reports/analysis-*.json`, `audit-*.{json,md}`,
  `clients/<id>/memory.json`)
- Planned: `audits` — `id`, `client_id`, `crawl_id`, `generated_at`, `summary`
  (jsonb); `audit_issues` — `audit_id`, `type`, `severity`, `url`, `message`

### API Endpoints
- CLI: `npm run analyze -- <crawl.json>`, `npm run audit -- <report.json>`,
  `npm run track -- <clientId> <report.json>`
- Planned: `GET /api/clients/[clientId]/audits`, `GET .../audits/[id]`

### UI Components
- CLI + Markdown/JSON today
- Planned: audit view with issue list, severity filters, and task generation

### Future Enhancements
- Persist audits/issues; Core Web Vitals + Lighthouse integration
- Configurable rules/thresholds per client; severity scoring model
- One-click "create tasks from audit" into `seo_tasks`

---

## Module 10 — Content Planning

**Status:** Planned

### Purpose
Plan, brief, and track SEO content from keyword opportunity to publication.

### Features
- Keyword/topic backlog with search volume, difficulty, intent, priority
- Content briefs (target keyword, outline, internal links, word-count target)
- Editorial calendar and workflow (Idea → Brief → Draft → Review → Published)
- Link content items to target URLs and to Search Console performance

### Database Tables
- `content_items` — `client_id`, `title`, `target_keyword`, `intent`, `status`,
  `assignee_id`, `target_url`, `due_date`
- `content_briefs` — `content_item_id`, `outline` (jsonb), `internal_links`
  (jsonb), `word_target`, `notes`
- `keywords` — `client_id`, `keyword`, `volume`, `difficulty`, `intent`,
  `priority`

### API Endpoints
- `GET/POST /api/clients/[clientId]/content`
- `PATCH /api/content/[id]` (status, assignee, brief)
- `GET /api/clients/[clientId]/keywords`

### UI Components
- Editorial calendar + Kanban board
- Brief editor, keyword backlog table, content-progress panel

### Future Enhancements
- AI-assisted brief and outline generation
- SERP analysis and competitor content gap
- Publish integrations (CMS/WordPress), performance loop back from GA4/GSC

---

## Module 11 — AI Visibility

**Status:** Planned

### Purpose
Track how a client's brand and pages appear in AI/LLM answer engines (ChatGPT,
Gemini, Perplexity, Google AI Overviews) and surface optimization opportunities.

### Features
- Prompt sets per client; periodic querying of answer engines
- Track brand mentions, citation/source inclusion, and sentiment
- AI visibility score and trend; competitor share-of-voice
- Recommendations to improve citability (schema, entities, freshness)

### Database Tables
- `ai_prompts` — `client_id`, `prompt`, `engine`, `active`
- `ai_visibility_checks` — `prompt_id`, `checked_at`, `mentioned` (bool),
  `cited` (bool), `sentiment`, `raw_response` (jsonb)
- `ai_visibility_scores` — `client_id`, `date`, `score`, `share_of_voice`

### API Endpoints
- `GET/POST /api/clients/[clientId]/ai-prompts`
- `POST /api/cron/ai-visibility` (scheduled checks)
- `GET /api/clients/[clientId]/ai-visibility`

### UI Components
- AI visibility dashboard (score, trend, per-prompt results)
- Prompt manager, competitor comparison

### Future Enhancements
- Multi-engine expansion, geographic/locale variants
- Entity/knowledge-graph gap analysis; automated content suggestions

---

## Module 12 — Reporting

**Status:** Partial

### Purpose
Package crawls, audits, comparisons, and analytics into shareable client
reports.

### Features
- Generated report artifacts (crawl, analysis, audit Markdown/JSON, comparison)
- Weekly scheduled reports committed to the repo (`reports/scheduled/<client>/`)
- Improvement score and new/resolved/remaining trend per client

### Database Tables
- File-based today
- Planned: `reports` — `id`, `client_id`, `type`, `period_start`, `period_end`,
  `generated_at`, `summary` (jsonb), `storage_url`

### API Endpoints
- Produced by CLI/automation today
- Planned: `GET /api/clients/[clientId]/reports`,
  `POST /api/clients/[clientId]/reports` (generate),
  `GET /api/reports/[id]/download`

### UI Components
- Planned: Reports index per client, report viewer, PDF/scheduled email export

### Future Enhancements
- Branded PDF export, white-label templates, scheduled email delivery
- Report builder with selectable sections; client annotations/sign-off

---

## Module 13 — Automation

**Status:** Partial

### Purpose
Run recurring SEO work (syncs, crawls, audits, reports) without human
intervention.

### Features
- Automatic daily Search Console sync (protected cron endpoint)
- Weekly crawl → compare → audit → commit-reports orchestration
- Per-site scheduled-crawl configuration

### Database Tables
- Config today (`automations/scheduled-crawls.json`)
- Planned: `automation_jobs` — `id`, `type`, `client_id`, `schedule`,
  `enabled`, `last_run_at`, `last_status`

### API Endpoints
- `POST /api/cron/search-console` (secret-protected)
- CLI: `npm run weekly -- <config>`

### UI Components
- Config file today
- Planned: automation settings UI (enable/disable jobs, schedules, run history)

### Future Enhancements
- Durable job queue/worker, retries, and per-job run history in the DB
- Event-driven triggers, per-client schedules, failure alerting

---

## Module 14 — Notifications

**Status:** Planned

### Purpose
Keep the team and clients informed of important SEO events (regressions, task
changes, completed reports).

### Features
- In-app notification center and email notifications
- Event triggers: traffic/coverage regressions, new critical audit issues,
  task assignments/status changes, report ready
- Per-user notification preferences

### Database Tables
- `notifications` — `id`, `user_id`, `type`, `title`, `body`, `entity_type`,
  `entity_id`, `read_at`, `created_at`
- `notification_preferences` — `user_id`, `channel`, `event_type`, `enabled`

### API Endpoints
- `GET /api/notifications`, `PATCH /api/notifications/[id]` (mark read)
- `GET/PUT /api/notifications/preferences`
- Internal: notification dispatch on domain events

### UI Components
- Header bell + notification dropdown, notifications page
- Preferences settings panel

### Future Enhancements
- Slack/Teams/webhook channels, digest emails
- Threshold-based alerting rules; on-call routing for critical issues

---

## Module 15 — GitHub Actions

**Status:** Implemented

### Purpose
Continuous integration and scheduled SEO automation via GitHub Actions.

### Features
- **CI:** lint, typecheck, tests, component render tests, Prisma validate, build
  on push/PR
- **Weekly SEO audit:** every Monday — crawl → compare → generate tasks →
  commit reports → refresh dashboard data
- Manual dispatch with a configurable site list

### Database Tables
- None directly (workflows operate on files and the app's endpoints)

### API Endpoints
- Workflows invoke CLI scripts (`npm run weekly`) and the sync endpoint
  (`POST /api/cron/search-console`)

### UI Components
- None (workflow definitions in `.github/workflows/`)

### Future Enhancements
- Per-client scheduled workflows, matrix crawls, artifact uploads
- Deploy pipeline (preview + production), security scanning
- Status reporting back into the app (job history, failures)

---

## Cross-Cutting Concerns

- **Security:** server-side authorization on every protected route and action;
  Row-Level Security and secret encryption planned; `CRON_SECRET` protects
  scheduled endpoints.
- **Observability:** structured logging, error tracking, and job run history
  (planned).
- **Multi-tenancy:** agency → clients → per-client data isolation; client users
  scoped to their own workspace (planned hardening).
- **Data bridge:** the file-based crawl/audit/track pipeline will be persisted to
  the database so the Developer, Tasks, Timeline, and Reports views read live
  data.

## Roadmap Summary

| # | Module | Status |
| --: | --- | --- |
| 1 | Authentication | Implemented |
| 2 | Client Management | Implemented |
| 3 | Internal Dashboard | Partial |
| 4 | Developer Dashboard | Planned |
| 5 | Client Dashboard | Implemented / Partial |
| 6 | SEO Crawler | Implemented |
| 7 | Search Console Integration | Implemented |
| 8 | Google Analytics Integration | Planned |
| 9 | Technical SEO Audit | Implemented |
| 10 | Content Planning | Planned |
| 11 | AI Visibility | Planned |
| 12 | Reporting | Partial |
| 13 | Automation | Partial |
| 14 | Notifications | Planned |
| 15 | GitHub Actions | Implemented |

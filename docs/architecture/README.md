# Architecture

The SEO OS is a **modular monolith** following **Clean Architecture**.

## Backend layers (`backend/`)
- `domain/` — entities, value objects, pure rules (no I/O)
- `application/` — use cases + ports (interfaces the outside world must satisfy)
- `infrastructure/` — adapters: Prisma, Supabase, Google APIs, Playwright
- `interface/` — controllers, zod schemas, mappers

Dependencies point inward. Delivery layers: the Next.js app (`src/app`), the
shared presentation layer (`frontend/`) and feature modules (`dashboard/`), CLI
`scripts/`, and `automations/` + `.github/` workflows.

## Top-level folders
| Folder | Responsibility |
| --- | --- |
| `frontend/` | Shared presentation layer (design system, components, hooks) |
| `backend/` | Clean-architecture core (domain / application / infrastructure / interface) |
| `crawler/` | Crawler configuration & profiles (engine lives in `backend/*/crawl`) |
| `agents/` | AI agent definitions, prompts, tools |
| `clients/` | Per-client workspace data |
| `knowledge/` | SEO knowledge base & playbooks |
| `templates/` | Report, brief, and email templates |
| `automations/` | Scheduled & event-driven workflows |
| `scripts/` | CLI & ops tooling |
| `.github/` | CI and scheduled workflows |
| `docs/` | Documentation |

Other app directories: `src/app` (App Router routes), `src/components/ui`
(shadcn/ui primitives), `src/lib` (Prisma & Supabase clients), `dashboard/`
(dashboard feature modules), `prisma/` (schema & migrations), `reports/`
(generated report output).

## Tech stack
Next.js (App Router) · TypeScript (strict) · Tailwind CSS + shadcn/ui · Recharts
· Supabase (auth) · Prisma (PostgreSQL) · Playwright · Docker · GitHub Actions.

## Path aliases
`@/*` → `src/*` · `@backend/*` · `@frontend/*` · `@dashboard/*` · `@agents/*` ·
`@knowledge/*` · `@templates/*` · `@automations/*`.

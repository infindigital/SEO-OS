# .github

GitHub configuration and Actions workflows.

- `workflows/ci.yml` — lint, typecheck, tests, component render tests, Prisma
  validate, and build on push / pull request.
- `workflows/weekly-seo.yml` — every Monday: crawl → compare → generate tasks
  → commit reports → refresh dashboard data.

See `docs/modules/15-github-actions`.

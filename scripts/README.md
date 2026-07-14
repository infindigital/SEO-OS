# scripts

Operational and developer tooling: database seeding, one-off maintenance tasks,
data migrations, and local developer convenience scripts.

Scripts may reach into `backend/` use cases and infrastructure but are never
imported by application code. Keep them idempotent and safe to run repeatedly.

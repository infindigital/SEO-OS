# backend

The core of the SEO OS, organised by **Clean Architecture** layers. Dependencies
point inward only: outer layers depend on inner layers, never the reverse.

```
domain/          Enterprise business rules — entities, value objects, domain
                 services. Pure TypeScript, zero framework or I/O dependencies.

application/     Application business rules — use cases orchestrating the
                 domain. Defines the ports (interfaces) it needs from the
                 outside world.

infrastructure/  Adapters implementing application ports — database (Prisma),
                 Supabase, external SEO APIs, AI providers, crawlers.

interface/       Delivery mechanisms — controllers and mappers that translate
                 between transport (HTTP/route handlers) and use cases.
```

The `frontend/`, `dashboard/`, and Next.js `src/app` route handlers act as the
outermost delivery layer and depend on `backend/` — never the other way around.

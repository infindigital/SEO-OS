# backend/infrastructure

Adapters that implement the ports declared in `application/`. This is where the
outside world is wired in:

- Persistence via Prisma (`src/lib/prisma.ts`)
- Supabase (auth, storage, realtime)
- External SEO data providers and crawlers
- AI model providers used by `agents/`

Infrastructure depends on `application/` and `domain/`; nothing in those layers
depends on infrastructure.

# frontend

Shared presentation layer for the SEO OS: the design system and reusable UI
consumed by the Next.js App Router (`src/app`) and the dashboard feature modules
(`dashboard/`).

- `components/` — shared / design-system components (beyond the shadcn/ui
  primitives in `src/components/ui`)
- `hooks/` — reusable client hooks
- `lib/` — client-side utilities and formatters

Imported via the `@frontend/*` path alias. Presentation talks to the backend
through interface adapters and server actions — it never imports `backend`
internals directly.

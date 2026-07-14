# frontend

The shared presentation layer consumed by the Next.js application: the design
system, reusable UI components, hooks, and client-side utilities.

Routing and server entry points live in `src/app` (App Router). This directory
holds the framework-agnostic-ish building blocks those routes compose. It is
imported via the `@frontend/*` path alias and never imports from `backend/`
internals directly — it talks to the backend through interface adapters.

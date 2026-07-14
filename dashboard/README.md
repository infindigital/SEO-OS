# dashboard

Feature modules for the operator-facing dashboard — the surfaces where SEO
teams manage clients, review audits, run agents, and read reports.

Each dashboard feature is a self-contained module (views, view-models, and the
client-side wiring to backend interface adapters). Route segments in
`src/app` compose these modules. Imported via the `@dashboard/*` path alias.

# backend/interface

The delivery boundary of the backend: controllers, request/response mappers,
and input validation that translate transport-level concerns (Next.js route
handlers, server actions) into use-case calls and back.

This layer depends on `application/`. The Next.js `src/app` routes,
`dashboard/`, and `frontend/` invoke these interface adapters rather than
reaching into use cases directly.

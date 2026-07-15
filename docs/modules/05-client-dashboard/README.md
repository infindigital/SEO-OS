# 05. Client Dashboard

**Status:** Implemented

Two views of a client's engagement:

## Client portal (`/portal`) — client-facing

A curated, non-technical view for CLIENT users. Displays SEO Score, Organic
Traffic, Keywords, Completed Work, Current Focus, Timeline, and Reports —
**no crawl issues, task internals, or index coverage**. A client resolves to
their own workspace by contact email and can only ever see their own; staff can
preview any client via `/portal?clientId=<id>` (a link is on the staff client
page) and publish reports. Clients are redirected here from `/dashboard`.

## Staff client dashboard (`/clients/[clientId]`)

Per-client Search Console performance and index coverage (technical), staff only.

## Data

`client_reports` (migration `add_client_reports`) surfaces delivered reports on
the portal; the seed enriches the demo client and publishes two reports.

- **Spec:** [`../../../PROJECT_SPEC.md`](../../../PROJECT_SPEC.md) → "Client Dashboard"
- **Code:** `backend/*/client-portal`, `backend/*/client-report`, `src/app/(dashboard)/portal`, `dashboard/portal`, `backend/application/dashboards`, `src/app/(dashboard)/clients/[clientId]`, `dashboard/client`

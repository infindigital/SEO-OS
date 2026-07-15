# 03. Internal Dashboard

**Status:** Implemented

Agency-wide operational overview at `/internal` (staff only).

## Cards

Total Clients, Monthly Revenue, Open Tasks, Critical Issues, Reports Pending,
Active Developers, Average SEO Score. Live counters (clients, revenue,
developers, avg SEO, reports pending) are computed from the current `clients`
and `profiles` tables; snapshot counters (open tasks, critical issues) come from
the latest `daily_metrics` row.

## Charts (Recharts)

- **SEO Health** — average portfolio SEO score over time
- **Client Growth** — cumulative clients by month (from `Client.createdAt`)
- **Monthly Revenue** — recurring retainer revenue over time
- **Task Completion** — completed vs. open tasks over time

## Data

`daily_metrics` gained `completed_tasks`, `critical_issues`, and
`monthly_revenue` (migration `add_internal_dashboard_metrics`); the seed
populates ~90 days of demo history.

## References

- **Spec:** [`../../../PROJECT_SPEC.md`](../../../PROJECT_SPEC.md) → "Internal Dashboard"
- **Code:** `backend/application/dashboards/use-cases/get-internal-dashboard.ts`, `src/app/(dashboard)/internal`, `dashboard/internal`

# 02. Client Management

**Status:** Implemented

Onboard and manage agency clients: full CRUD, archive/restore, portfolio
KPIs, search, and status tracking.

## Fields

Name, Website, Contact (name/email), Status, Owner (staff member), Industry,
Monthly Retainer (whole USD), SEO Score (0–100), Last Audit, Current Focus,
Notes. Archiving is a soft-hide via `archivedAt` — distinct from status and
recoverable.

## API routes

- `GET /api/clients` — list with `q`, `status`, `includeArchived`, `archivedOnly`
- `POST /api/clients` — create
- `GET /api/clients/:id` — fetch one
- `PATCH /api/clients/:id` — update
- `DELETE /api/clients/:id` — permanently remove
- `POST /api/clients/:id/archive` — archive/restore (`{ "archived": boolean }`)

All routes are gated to staff (admin/developer).

## Client memory

Every client carries a persistent, human-editable `clients/<id>/memory.md` with
seven sections: Previous Audits, Previous Reports, Completed Tasks, Developer
Notes, Meeting Notes, Client Preferences, and Business Goals. Memory is **loaded
before recommendations are generated** so guidance is tailored to the client's
goals and preferences and never re-recommends completed work.

```bash
python3 memory/run_memory.py init acme --host acme.com
python3 memory/run_memory.py add acme "Business Goals" "Grow organic revenue 30%"
python3 generator/run_generate.py audit.json --client acme --record-audit
```

Managed by the `memory/` package (`client_memory`); see
[`memory/README.md`](../../../memory/README.md).

## References

- **Spec:** [`../../../PROJECT_SPEC.md`](../../../PROJECT_SPEC.md) → "Client Management"
- **Code:** `backend/*/client`, `src/app/(dashboard)/clients`, `src/app/api/clients`, `dashboard/clients`, `memory/client_memory`

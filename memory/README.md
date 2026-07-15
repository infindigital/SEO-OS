# memory

The client memory system. Every client carries a persistent, human-editable
`memory.md` at `clients/<clientId>/memory.md` with seven sections:

- **Previous Audits**
- **Previous Reports**
- **Completed Tasks**
- **Developer Notes**
- **Meeting Notes**
- **Client Preferences**
- **Business Goals**

Memory is **loaded before recommendations are generated** so guidance is
tailored to the client's goals and preferences and never re-recommends work
that's already done. The AI audit generator (`generator/`) loads it via
`--client <id>`; the Claude narrator receives the memory as context, and the
rule-based narrator aligns its summary to the client's first business goal.

## Manage a client's memory

```bash
python3 memory/run_memory.py init acme --host acme.com
python3 memory/run_memory.py add  acme "Business Goals" "Grow organic revenue 30% in H2"
python3 memory/run_memory.py add  acme "Client Preferences" "Prefers Next.js; avoid jQuery"
python3 memory/run_memory.py show acme
```

Section titles must be quoted exactly (they are the `##` headers in `memory.md`).

## Generate recommendations with memory loaded

```bash
python3 generator/run_generate.py audit.json --client acme --record-audit
```

`--record-audit` appends a one-line summary of this audit to the client's
Previous Audits.

## Test

```bash
python3 -m pytest memory/tests
```

## Layout

- `client_memory/model.py` — `ClientMemory` model + `memory.md` render/parse
- `client_memory/store.py` — load/save under `clients/<id>/`, `record_audit`
- `run_memory.py` — CLI (`init` / `show` / `add` / `path`)
- `tests/` — unit tests

See `docs/modules/02-client-management`.

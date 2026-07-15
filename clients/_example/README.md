# clients/_example

Illustrative layout of a per-client workspace. At runtime each client gets a
`clients/<clientId>/` directory. Per-client configuration and site definitions
live here, alongside two memory artifacts:

- `memory.md` — the client memory system's seven-section knowledge base
  (Previous Audits, Previous Reports, Completed Tasks, Developer Notes, Meeting
  Notes, Client Preferences, Business Goals). Loaded before recommendations are
  generated. Managed by the `memory/` package; see `memory/README.md`.
- `memory.json` — crawl-comparison delta state from the TypeScript pipeline
  (gitignored for local runs; committed by the scheduled workflow).

`_example/memory.md` in this directory is a filled-in sample.

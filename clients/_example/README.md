# clients/_example

Illustrative layout of a per-client workspace. At runtime each client gets a
`clients/<clientId>/` directory. Currently the crawl-comparison state is stored
as `memory.json` (gitignored for local runs; committed by the scheduled
workflow). Per-client configuration and site definitions also live here.

# reports

Output destination for generated reports (audits, ranking summaries, content
performance). Generated files are **not** committed — this directory is kept in
version control via `.gitkeep`, while its contents are ignored (see the root
`.gitignore`).

Report generation logic lives in `backend/` and `automations/`; the rendered
artifacts land here at runtime.

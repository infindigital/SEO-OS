# backend/application

Application business rules: use cases that orchestrate domain objects to fulfil
a user or system intent (e.g. "run an on-page audit", "generate a content
brief").

Use cases depend only on `domain/` and on **ports** — interfaces they declare
for the capabilities they need (repositories, gateways). Concrete
implementations of those ports live in `infrastructure/`.

# Frontend implementation request

Read reviewer-frontend and the working branch instructions.

- Issue and acceptance criteria: …
- User action and expected screen: …
- API contract/schema, source, and version: …
- Loading/empty/error/partial/stale: …
- Behavior during rapid PR/run switching: …
- Task constraints and allowed dependencies: …

Inspect the existing code, make the change, and show one before/after example and available checks. If the contract is undefined, identify the specific gap. Do not create AGENTS.md.

## Required implementation context

- Owning component and layer: <transport, application, persistence, VCS/model adapter, UI/store>.
- Contract source and version: <API schema, event schema, migration, or agreed interface>.
- Identity and authorization: <actor, tenant, resource, accepted/rejected access>.
- Retry and concurrency: <operation key, duplicate delivery, rerun, stale response>.
- Observability: <correlation/run_id, safe events, counters, error codes>.
- Validation commands: <configured lint, typecheck, unit and integration targets>.
- Delivery scope: <local changes only, commit, or PR as requested>.

Follow the five-argument convention and required human review from project context. Use [coding-system](../prompts/coding-system.md) for direct model invocation.

## Design contract for this task

- Pinned design revision and affected component: <source and section>.
- Owning decision/contract: <approved source; unresolved item if any>.
- Identity/state mapping: <delivery vs automatic/manual review key; run vs coverage vs publication>.
- RuleSet and findings, if affected: <snapshot/version; candidate/domain/API mapping; history baseline>.
- Context/publication, if affected: <budget/cache dimensions; summary update/recreation>.

Use only fields relevant to the task. Do not resolve open design decisions by inventing API types or numerical limits.

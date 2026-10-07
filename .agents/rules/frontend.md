# Frontend rules and their purpose

Read the tech lead's instructions, [project context](project-context.md), package.json, tsconfig, and neighboring code first. The target stack is React, TypeScript, pnpm, ESLint, Zod, Zustand, Vitest, and Node.js. Use versions and commands from project configuration. Run Skylos in the configured language scope; it complements the language tooling and does not replace ESLint. Limit functions to five arguments under the counting and compatibility rules in project context.

Write Markdown files in English, except files named `README.md`, which must be written in Russian. Apply this convention to skill descriptions, rules, prompts, and templates as well as their examples.

| Decision | Purpose / example failure |
| --- | --- |
| Validate JSON at the boundary with the agreed Zod schema | `as Report` does not convert strings to numbers or reject an unknown status |
| Make DTOs reflect the actual API | Use the endpoint, request key, and response schema published by the API owner |
| Use Zustand for genuinely shared state and use selectors | A global change should not rerender the whole application; a local input does not require a store |
| Associate a request with the selected run/PR and ignore stale responses | Response A can arrive after B and display the wrong report |
| Handle loading, empty, error, partial, and stale states | A model failure with empty findings does not mean everything is fine |
| Keep JWTs and VCS secrets out of URLs, logs, and arbitrary persistent storage | History and telemetry must not disclose credentials; follow the accepted authentication design |
| A hidden button does not replace backend authorization | Someone can request another user's run directly, so the server checks permissions |
| Give a rerun a new action key; preserve it on retry | User intention differs from repeated delivery of a request |
| Render review text safely without executing dangerous HTML | Model/PR content can contain HTML and instructions |

A report snapshot includes run_id and a fixed SHA. An old report does not change when the PR is updated. The backend checks freshness and access before publishing comments. VcsReader/VcsPublisher, RabbitMQ, PostgreSQL, LLM Gateway, and integration secrets stay behind the server boundary. Redis is excluded from v1; a distributed limiter implementation remains an owning decision.

For fetch, use AbortController and/or a request generation counter. Cancellation alone does not guarantee that already completed parsing will not update state. Provide unmount cleanup when an effect continues working. Test rapid switching.

Commit format: `ISSUEID: exact issue title`. A PR describes changed behavior, related issues, actual checks, and limitations. Do not add AGENTS.md or change the whole project's configuration for one template.

## Run, report, publication and history

Use the pinned [design](project-context.md) and the owning API schema. ReviewRun lifecycle is NEW/QUEUED/RUNNING/COMPLETED/FAILED/CANCELLED; report coverage is complete/partial/failed; publication has its own state. Do not fold these into one status. A completed review with failed publication still has a readable result. The `.example` loader uses a local illustrative view DTO, not the LLM candidate schema or a prescribed API endpoint.

Display server-assigned finding_id, rule_id, lifecycle NEW/PERSISTING/FIXED and history links when the task/API supplies them. Do not infer FIXED from a missing finding, especially under partial coverage; baseline/matching belong to the backend. Rule configuration is project-scoped and versioned: a historical report keeps its original RuleSet even when rules are edited.

The runtime publisher maintains one PR/MR summary; inline comments and automatic code modification are outside v1. Publication retries use backend contracts and must not create a new review or duplicate summary. See [review contract](review-contract.md) for candidate/domain/API separation.

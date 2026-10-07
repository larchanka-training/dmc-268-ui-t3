---
name: reviewer-frontend
description: Implement React/TypeScript review UI tasks with validated DTOs, separate run and publication states, finding history and stale response protection.
---

Read [frontend rules](../../rules/frontend.md), [project context](../../rules/project-context.md), package.json, tsconfig and the owning API contract. Use the [implementation template](../../templates/implement.md).

Validate external DTOs with the agreed Zod schema and keep shared Zustand state minimal. Separate run lifecycle, analysis coverage and publication state. A completed review remains readable when publication fails. Bind displayed data to run_id and its snapshot; handle rapid switching, cleanup and accessible loading/error/partial/cancelled states.

For history tasks display server-assigned finding identity, lifecycle and links. Do not calculate FIXED from absence in a partial report or let the UI choose a new matching baseline. Preserve the difference between a fresh rerun action and a retry of that action. VCS/model integrations stay behind the backend.

The [loader template](../../templates/report-loader.ts.example) demonstrates state separation and race protection, not an approved endpoint DTO. Adapt it to the task API. Use the [test plan](../../templates/test-plan.md), run configured checks, and report actual results and unresolved contracts.

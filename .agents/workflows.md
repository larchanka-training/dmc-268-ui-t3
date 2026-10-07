# Frontend development and review workflow

## Implement a task

Use [reviewer-frontend](skills/reviewer-frontend/SKILL.md) with the [implementation template](templates/implement.md). For direct model calls, use [coding-system](prompts/coding-system.md) as the system message.

1. Read the issue, UI acceptance criteria, API schemas, auth policy, and affected component/store/adapter. Use project configuration for dependency versions and commands.
2. Define run lifecycle, analysis coverage, publication state and relevant history, plus loading, empty, error and stale display states, including rapid navigation and unmount behavior. Use the agreed Zod schema at the network boundary and selectors for shared Zustand state.
3. Implement the change, preserving accessibility and the five-argument convention in [project context](rules/project-context.md).
4. Use [reviewer-frontend-tests](skills/reviewer-frontend-tests/SKILL.md) and the [test plan](templates/test-plan.md). Run the configured pnpm commands for ESLint, strict TypeScript checks, Vitest, and the production build. Apply the configured Skylos check where appropriate.
5. Review the diff and prepare the [PR description](templates/pull-request.md). Follow the current task's delivery instructions and obtain the required human review before merge.

## Reuse the request-ordering templates

Copy [report-loader.ts.example](templates/report-loader.ts.example) and [report-loader.test.ts.example](templates/report-loader.test.ts.example) into the relevant module as `.ts` files. Replace the RunView schema with the actual API DTO schema and adapt fetchReport to the project's transport. Keep request generation checks on both success and failure paths. Connect cancellation to effect cleanup and AbortController where the transport supports it.

Run the tests with the project's Vitest configuration. Add component-level checks for visible states and accessibility, and API integration checks for the real response contract. Deferred promises provide deterministic control over response order without sleeps.

## Review a change

Use the local [reviewer-diff-review](skills/reviewer-diff-review/SKILL.md), [system prompt](prompts/review-system.md), and [schema](schemas/review.schema.json). Check runtime validation, stale responses, state ownership, auth handling, unsafe rendering, and user-visible failures. Use the same 2.0.0 run/SHA/RuleSet/location/relation and coverage semantics as the backend review service.

Read [review contract](rules/review-contract.md) before changing shared prompts/schemas. The model candidate report, persisted Finding and frontend API response are different contracts. The loader's local RunView demonstrates this separation; replace it with the API-owned DTO without losing independent publication errors or server-owned history.

## Isolated template verification

For package-only verification, create a disposable Node project with the team's selected Zod, Vitest, TypeScript and Node types. Copy both `.example` files into that project without their `.example` suffix, then run:

```sh
pnpm exec vitest run report-loader.test.ts
pnpm exec tsc --noEmit --strict --target ES2022 --module ESNext --moduleResolution bundler --skipLibCheck report-loader.ts report-loader.test.ts
```

The current template has 15 behavioral cases. This does not install dependencies into the application or prove React component/backend integration. The sample publication vocabulary is local to the template; adapt it alongside the API-owned DTO.

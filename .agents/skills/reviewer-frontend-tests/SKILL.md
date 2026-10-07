---
name: reviewer-frontend-tests
description: Test review UI contracts and visible behavior, including asynchronous run states, publication failures, finding history and request races.
---

Read [frontend rules](../../rules/frontend.md), [project context](../../rules/project-context.md), the API contract and [test plan](../../templates/test-plan.md). Use configured Vitest/component tooling and adapt fixtures to the owning DTO.

Check queued/running/cancelled states, completed analysis with failed publication, partial limitations, and server-owned history. Preserve a valid completed report when publication fails. Do not infer FIXED from missing entries. Test wrong-run responses and unknown DTO values.

Use deferred promises for both stale success and stale failure, and for cleanup; see [loader tests](../../templates/report-loader.test.ts.example). Replace transport while preserving the logic under test. Component tests assert visible state/accessibility; module typechecking does not establish component or API integration behavior.

Report scenarios, tests, actual commands/results and unavailable prerequisites. Do not run untrusted PR code in an environment containing secrets.

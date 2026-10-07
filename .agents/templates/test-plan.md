# Frontend behavior verification plan

Fill in issue, owning API version, user action, expected visible result, fixtures/cleanup, test level and actual command/result. Use [testing-system](../prompts/testing-system.md) for direct model calls.

| Given / When | Required result |
| --- | --- |
| Invalid DTO, unknown run state or wrong run_id | Contract error; invalid data does not enter the store |
| NEW/QUEUED/RUNNING response | Appropriate in-progress state; no claim of a clean review |
| CANCELLED run | Cancellation is visible, distinct from model failure |
| COMPLETED analysis with FAILED publication | Saved findings remain readable; publication error is separate |
| Partial coverage | Specific limitations remain visible |
| A requested, then B; A succeeds or fails late | B's result/error remains selected |
| Component cleanup before completion | No late success or error update |
| Two fresh rerun actions; transport retries one | Fresh actions have distinct keys; retry preserves its key |
| Prior success, failed run, later history | Display server-provided baseline/lifecycle; failed run does not erase findings |
| Partial report lacks a previous finding | UI does not infer FIXED |
| Switching historical runs | Snapshot and finding links correspond to selected run |
| Keyboard/screen reader use | Labels, focus, actions and errors are accessible |

Adapt the [loader](report-loader.ts.example) and [tests](report-loader.test.ts.example) to the actual API schema. Module tests verify request ordering and parsing; add component tests for visible states and integration checks for the API. Do not invent endpoints, polling intervals or matcher behavior from this template.

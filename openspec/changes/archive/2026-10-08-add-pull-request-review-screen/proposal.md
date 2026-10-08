# Proposal

## Why

The run page (`/runs/$runId`) already shows the diff and inline findings, but it doesn't read as a pull request review yet. It doesn't say who opened the PR or which branches it merges, it gives no overall verdict, and the findings tell the reader what is wrong without showing the fix as code. Reviewers need to see at a glance whether a PR is safe to merge and which lines need work. The UI also needs the Critical / Warning / Info vocabulary the product uses.

## What Changes

- **PR overview header** on the run page: PR title and number, repository, author (avatar and login), base ← head branches, head SHA, a link to the PR on the provider, and the review status badges that already exist (run, coverage, publication).
- **Overall verdict and score.** The client derives these from the run status, coverage and findings, using a fixed formula. A run that is incomplete, failed or only partly covered never shows a passing verdict.
- **Severity display groups.** The UI shows three badges: Critical (`critical`), Warning (`high`, `medium`) and Info (`low`). The four-level wire contract, the ordering and the validation stay as they are. Each card still shows the original level as text, and summary counts are given per group.
- **Suggested change block** in finding cards. When a finding carries a suggested code replacement, the card shows a syntax-highlighted −/+ mini diff of the anchored lines against the replacement, plus a "Copy suggestion" action. When it has none, no block appears.
- **Flagged-line markers** in the diff gutter, on lines that have findings. Each marker shows the highest severity group on that line and has an accessible name.
- **Wire contract additions**, proposed and all optional: PR author, base/head branch names and PR URL on `ReviewRunWire`, and `suggested_change` on `FindingWire`. Old payloads without these fields still validate, and the UI leaves out the parts it has no data for.
- **Mock data** gets PR metadata and suggested changes on several findings, and the copy of the mock state in `FRONTEND_ARCHITECTURE.md` is updated to match.
- Not in scope: an HTTP `ReviewApi` adapter (the backend contract isn't approved, so this stays mock-only), word-level intra-line diff highlighting, applying or committing suggestions, and publishing inline comments to the VCS (outside v1).

## Capabilities

### New Capabilities

- `pull-request-overview`: the PR identity and metadata header on the review page, and the derived overall verdict and score with their rules.

### Modified Capabilities

- `review-findings-display`: severity is shown as Critical/Warning/Info groups (finding content and summary counts change); a new requirement for the suggested-change block; a new requirement for flagged-line markers in the diff gutter.

## Impact

- **Wire types / schemas**: `src/shared/api/types.ts`, `src/entities/review-run/model/schema.ts` and `src/entities/finding/model/schema.ts` get new optional fields. The PR URL is accepted only as an absolute `https` URL.
- **Entities**: `entities/finding` (severity groups, `SeverityBadge`, `FindingCard`, new `SuggestedChange`), `entities/review-run` (PR metadata view model), and `entities/diff` (resolving the original lines for a suggestion, the gutter marker slot in line rows).
- **Widgets/pages**: new `widgets/pull-request-overview`; `widgets/review-summary` switches to group counts; `widgets/diff-viewer` (markers and suggestion wiring); `pages/review-run` (layout).
- **Styles**: severity color tokens move from four levels to three groups in `src/app/styles/index.css`, for both light and dark themes.
- **Mock / docs**: `src/shared/api/mock/app-state.mock.ts` and `FRONTEND_ARCHITECTURE.md`, which a sync test keeps aligned.
- **Contracts**: `suggested_change` and the PR metadata fields are proposals to the backend/contract owners. They don't change the team's `review.schema.json` severity enum.
- No new runtime dependencies. Highlighting reuses the existing Shiki-based `shared/lib/highlighter`.

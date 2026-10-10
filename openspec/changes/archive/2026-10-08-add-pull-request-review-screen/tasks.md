# Tasks

## 1. Wire contract and validation

- [x] 1.1 Move the `httpsUrl` refinement from `entities/repository/model/schema.ts` to `shared/lib/https-url.ts` and re-import it in the repository schema. Verify that the existing repository schema tests still pass (`pnpm test src/entities/repository`).
- [x] 1.2 Add optional `author`, `base_branch`, `head_branch`, and `pull_request_url` to `ReviewRunWire` in `shared/api/types.ts`, and extend `reviewRunSchema` to validate them (`.nullish()`, https-only URLs) and map them to `author`, `baseBranch`, `headBranch`, and `pullRequestUrl`, normalized to `null`. Verify with new schema tests: a payload without the fields passes, a full payload maps correctly, and `javascript:` in the PR URL or avatar URL is rejected.
- [x] 1.3 Add optional `suggested_change` to `FindingWire` and `findingSchema`: positive `start_line`, `end_line >= start_line`, `replacement` that may be empty, and rejected on LEFT anchors. Map it to `suggestedChange`. Verify with schema tests for the valid, empty-replacement, inverted-range, and LEFT-anchor cases.
- [x] 1.4 Add a query test in `entities/finding/api/queries.test.tsx` showing that a findings payload with an inverted suggestion range puts the query into its error state. Verify that the test passes.

## 2. Severity display groups

- [x] 2.1 Add `SEVERITY_GROUPS`, `severityGroup`, `GROUP_LABEL`, `countByGroup`, and `highestGroup` to `entities/finding/lib/severity.ts` and export them from the slice index. Verify with unit tests covering the level → group mapping, counts (1 critical, 2 high, 1 medium, 1 low → 1/3/1), and the highest group.
- [x] 2.2 Replace the `--severity-{high,medium,low}` tokens with `--severity-{warning,info}` (plus `-bg`) in the light, dark media-query, and `[data-theme=dark]` blocks and the `@theme` mapping in `src/app/styles/index.css`. Verify that `pnpm lint` passes and that no reference to `severity-high`, `severity-medium`, or `severity-low` remains (grep).
- [x] 2.3 Update `SeverityBadge` to render the group label and color for a level, add `SeverityGroupBadge`, and show the level text ("High") in the `FindingCard` header. Verify by updating `FindingCard.test.tsx` so that a high finding shows the "Warning" badge and the "High" text.
- [x] 2.4 Switch `ReviewSummary` to show Critical/Warning/Info group counts. Verify by updating `ReviewSummary.test.tsx` with the "Counts by group" scenario.
- [x] 2.5 Add `FindingCard` tests for the expandable card: an open card starts expanded, the toggle hides the details and sets `aria-expanded="false"`, and Enter on the focused toggle expands it. Verify that the tests pass.

## 3. Suggested change block

- [x] 3.1 Add `entities/diff/lib/head-lines.ts` (`headLines({ file, contentLines, start, end })`), which prefers content lines, falls back to the RIGHT lines of the hunks, and returns `null` when any line is missing. Export it from the slice. Verify with unit tests for content-backed, hunk-only, and missing-line ranges.
- [x] 3.2 Build `entities/finding/ui/SuggestedChange.tsx`: a −/+ mini diff using the diff color tokens, syntax highlighting through `useHighlightedLines`, the "AI suggestion · not applied" label, the removal wording for an empty replacement, and the replacement-only note when `originalLines` is null. Verify with component tests for each variant and for HTML in the replacement rendering literally.
- [x] 3.3 Add "Copy suggestion" to `SuggestedChange` with local `idle | copied | failed` state and an `aria-live` status. Verify with tests that stub `navigator.clipboard.writeText`: the success path copies the exact text and announces "Copied", and the rejection path shows an error and leaves the button enabled.
- [x] 3.4 Add a `suggestion` slot to `FindingCard`, rendered after Recommendation inside the collapsible details. In `widgets/diff-viewer`, pass a `resolveHeadLines` callback from `FileBody` (and to `UnplacedFindings`) into `FindingItem`, which renders `SuggestedChange` with `languageFromPath(anchor.path)`. Verify with a `DiffViewer.test.tsx` case: the suggestion block is under the flagged line and shows the original head lines from the diff.

## 4. Flagged line markers

- [x] 4.1 Add optional marker slots to `UnifiedLineRow` (`marker`) and `SplitLineRow` (`markers.LEFT/RIGHT`) in `entities/diff/ui/line-rows.tsx`, rendered at the leading edge of the line-number cell without changing the column templates. Verify that the existing `line-rows.test.tsx` passes and add a test that the slot renders in the right cell.
- [x] 4.2 Build `widgets/diff-viewer/ui/FlaggedLineMarker.tsx`: a button colored by `highestGroup` of the unresolved findings, or in the resolved style, with the accessible name from the spec ("2 findings, highest Critical"), that calls `selectFinding` on the first finding when clicked. Wire it into `FileBody` from `placement.byRow` for both modes. Verify with `DiffViewer.test.tsx` cases for the marker name, click-to-select, the all-resolved name, and the marker staying on the correct side after toggling to split mode.

## 5. Pull request overview

- [x] 5.1 Add `widgets/pull-request-overview/lib/verdict.ts` with `deriveVerdict` and `deriveScore`, following the spec's rules and weights. Verify with unit tests for every verdict scenario (in progress, failed/cancelled/failed coverage, critical, warning, partial, clean), the score examples (54 and the floor at 0), and no score for partial coverage or a running run.
- [x] 5.2 Build `PullRequestOverview`: h1 title, repo, `#n`, short SHA, the provider link (`target="_blank" rel="noopener noreferrer"`), author avatar with initial fallback, `base ← head` with sr-only phrasing, the run/coverage/publication badges, and the verdict and score panel with the heuristic label. Export it from the slice index. Verify with component tests for each identity, author, branch, and link scenario, and for the older payload without metadata.
- [x] 5.3 Remove the title and status block from `ReviewSummary`, render `PullRequestOverview` above it in `ReviewRunPage`, and pass the findings counts. Verify by updating `ReviewRunPage.test.tsx`: the page heading is the PR title, the verdict is shown, an unsafe PR URL shows the error state with "Retry", and resolving the only critical finding leaves the verdict at "Changes requested".

## 6. Mock data and architecture doc

- [x] 6.1 Extend `shared/api/mock/app-state.mock.ts` with author `octocat` (https avatar), branches `main` ← `feature/user-search`, a PR URL, and `suggested_change` on `f-debug-enabled`, `f-wildcard-hosts`, and `f-reflected-xss`, keeping at least one finding without a suggestion. Verify that `mock-review-api.test.ts` passes and that the fixtures validate through the entity schemas.
- [x] 6.2 Update `FRONTEND_ARCHITECTURE.md`: re-embed the mock state, and document the severity display groups, the PR overview widget, and the suggestion and marker slots. Verify that `app-state.mock.test.ts` (the doc sync test) passes.

## 7. Integration checks

- [x] 7.1 Run `pnpm check-types`, `pnpm lint`, `pnpm test`, and `pnpm format:check`, and verify that all of them pass with zero warnings (use `rtk proxy` or the direct binary for exit-code checks).
- [x] 7.2 Run `pnpm dev` in mock mode, open the mock run, and check by hand in light and dark themes and in unified and split modes that the PR header, verdict, and score render, that flagged lines show markers, that expandable cards appear under the right lines with Critical/Warning/Info badges, and that suggestion blocks highlight and copy. Verify by recording the result in the PR description.

# Design

## Context

`/runs/$runId` (`pages/review-run/ui/ReviewRunPage.tsx`) already loads the run, the unified diff text, and the findings through TanStack Query and renders `ReviewSummary` and then `DiffViewer`. What already works:

- **Diff** (`entities/diff`, `widgets/diff-viewer`): the parser, unified/split rows built in `lib/rows.ts`, Shiki highlighting through `useDiffTokens`, gaps that expand, and file collapse. View mode lives in the Zustand `diff-view-store`.
- **Findings** (`entities/finding`): a Zod schema with the four-level `SEVERITIES`, plus `FindingCard` (already collapsible), `SeverityBadge`, and the `finding-nav-store` (selection). `FileBody` places findings under rows with `placeOnUnifiedRows` / `placeOnSplitRows` and renders them in an `AttachmentRow`.
- **Data** comes only from the mock adapter (`shared/api/mock`). The `app-state.mock.ts` fixtures are embedded verbatim in `FRONTEND_ARCHITECTURE.md` and a test checks the two match.

Constraints:

- FSD layering is enforced by lint. No cross-slice imports inside a layer, so `entities/diff` cannot import `entities/finding`, and `entities/review-run` cannot import `entities/finding`.
- Function parameters are limited to five (a sprint rule), so prefer typed input objects.
- The team's `review.schema.json` fixes severity at `critical|high|medium|low`, and its `suggestion` field is prose. The backend contract is still a draft (see `.agents/rules/project-context.md`).

The motivation is in proposal.md. The behavior is in `specs/pull-request-overview` and `specs/review-findings-display`.

## Goals / Non-Goals

**Goals:**

- Keep every new rule (verdict, score, severity grouping, original-line resolution) a pure function with unit tests, separate from components.
- Add to the wire contract only optional fields, so current fixtures and a future backend without them still validate.
- Keep the diff entity unaware of findings. Markers and suggestions are put in through slots by the widget.

**Non-Goals:**

- An HTTP `ReviewApi`, word-level intra-line highlighting, applying suggestions, and a file tree or file list sidebar.
- Changing how findings are placed, how gaps expand, or how replies and resolution work.

## Decisions

### 1. Severity groups are a display mapping in `entities/finding/lib/severity.ts`

Add `SEVERITY_GROUPS = ['critical', 'warning', 'info']`, `severityGroup(level)`, `GROUP_LABEL`, `countByGroup()`, and `highestGroup()`. `sortBySeverity` keeps sorting by the four levels. `SeverityBadge` takes a `severity` (level) and renders the label and color of its group. A new `SeverityGroupBadge` takes a group, for the summary counts. `FindingCard` shows the level text (for example "High") beside the rule id.

In CSS, `--severity-{critical,high,medium,low}[-bg]` become `--severity-{critical,warning,info}[-bg]` in the light theme, the dark media query, and the `[data-theme=dark]` blocks. Warning reuses the current medium (amber) palette and Info reuses the current low (blue) palette, so their contrast was already checked. The old `high` tokens are removed.

_Alternative:_ changing the wire enum to three levels. The user rejected this because it conflicts with the team-owned contract.

### 2. PR metadata as optional fields on `ReviewRunWire`

```ts
author?: { login: string; avatar_url: string | null } | null
base_branch?: string | null
head_branch?: string | null
pull_request_url?: string | null   // absolute https only
```

In the Zod schema these are `.nullish()` and map to view-model fields `author`, `baseBranch`, `headBranch`, and `pullRequestUrl`, each normalized to `null`. The `httpsUrl` refinement in `entities/repository/model/schema.ts` moves to `shared/lib/https-url.ts` so both entities can use it without a cross-slice import, and `avatar_url` goes through the same refinement. Because an invalid URL fails validation for the whole run, the page shows its existing error and retry state.

_Alternative:_ a separate `GET /runs/{id}/pull-request` resource. That would mean an extra query and an extra loading state for a few fields that belong to the run anyway.

### 3. Verdict and score are derived in a new widget, `widgets/pull-request-overview`

`lib/verdict.ts` exports `deriveVerdict({ runStatus, coverageStatus, groupCounts })` and `deriveScore({ runStatus, coverageStatus, levelCounts })`. Both take plain counts, so the widget composes data from `entities/review-run` and `entities/finding` without those entities depending on each other. The rules and weights are the ones in the spec. All findings count whatever their UI resolution status, because resolution is UI-only discussion state (see the existing "UI-only discussion state" requirement) and doesn't prove the code changed.

The widget's `PullRequestOverview` renders the identity row (h1 title, repo, `#n`, short SHA, provider link), the author (avatar `<img>` with initial fallback), the branches (`base ← head`, with an sr-only phrase), the status badges from `entities/review-run`, and the verdict and score panel.

`ReviewSummary` drops its title and status block, which move to the overview, and keeps the group counts, the resolved/unresolved counts, the coverage note, and prev/next navigation.

_Alternatives:_ having the backend send the verdict and score (rejected, the user chose client derivation), or putting this in `widgets/review-summary`. The overview is a separate concern (PR identity), and splitting it keeps both widgets small.

### 4. `suggested_change` on `FindingWire`

```ts
suggested_change?: { start_line: number; end_line: number; replacement: string } | null
```

This always refers to head-side (RIGHT) lines of `anchor.path`. The schema rejects `start_line < 1`, `end_line < start_line`, and any non-null value on a finding with `anchor.side === 'LEFT'` (via `superRefine`), which maps to `suggestedChange` in the view model. `replacement` may be empty, which means "remove these lines". It is the one string field that is not trimmed or required to be non-empty.

_Alternative:_ parsing fenced ` ```suggestion ` blocks from `recommendation`. The user rejected this as fragile.

### 5. Original lines are resolved in `entities/diff`, and the block is rendered in `entities/finding`

`entities/diff/lib/head-lines.ts` exports `headLines({ file, contentLines, start, end }): string[] | null`. It prefers `contentLines` and falls back to the RIGHT-side lines (`newNo`) in the hunks. If any line in the range is missing it returns `null`. It knows nothing about findings.

`entities/finding/ui/SuggestedChange.tsx` takes `{ suggestion, originalLines, language }`. It renders a small grid in the same `diff-add` / `diff-del` colors as the diff, highlights both blocks with `useHighlightedLines` (code is rendered as text through `CodeTokens`), and adds the AI-suggestion label and the "Copy suggestion" button. Copy calls `navigator.clipboard.writeText(replacement)` and keeps local `idle | copied | failed` state with an `aria-live` status, and it never throws.

`FindingCard` gets a `suggestion?: ReactNode` slot rendered after Recommendation. `FindingItem` (widget) builds it: it calls `headLines` and `languageFromPath(anchor.path)` and passes the result through. `FileBody` already has `file` and `contentLines`, and passes a `resolveHeadLines` callback down to `FindingItem`. Unplaced findings use the same callback. When the file content is still loading, the block first shows replacement-only and then fills in the original lines once they arrive.

_Alternative:_ reusing `UnifiedLineRow` for the mini diff. Its grid, ARIA table roles, and anchors are tied to the diff table, and a nested table inside an `AttachmentRow` cell would confuse screen readers.

### 6. Flagged-line markers through a gutter slot

`UnifiedLineRow` and `SplitLineRow` get an optional `marker` (unified) or `markers: { LEFT?, RIGHT? }` (split) `ReactNode`, rendered inside the new-line or old-line number cell, positioned at its leading edge. This doesn't change the column templates, so `UNIFIED_COLUMNS` and `SPLIT_COLUMNS` stay the same. `FileBody` already has `placement.byRow`. For each placed row it renders `widgets/diff-viewer/ui/FlaggedLineMarker`, a small button colored by the `highestGroup` of the unresolved findings (or a resolved style). Its accessible name comes from the spec. On click it calls `selectFinding(firstId)`, and the existing scroll-to-selected effect in `DiffViewer` does the rest. In unified mode the marker goes in the new-number cell, or the old-number cell for removed lines. In split mode it goes on the side of the findings.

### 7. Page layout

```
ReviewRunPage
 ├─ PullRequestOverview   (h1, author, branches, link, badges, verdict + score)
 ├─ ReviewSummary         (group counts, resolved counts, coverage note, prev/next)
 ├─ RunStateNotice        (unchanged)
 └─ DiffViewer            (toolbar: view-mode toggle; files with markers + inline cards)
```

The loading, error, and retry handling in `ReviewRunPage` stays the same. The new validation failures reuse it.

### 8. Mock and docs

In `app-state.mock.ts`, the run gets an author (`octocat`, https avatar), branches `main` ← `feature/user-search`, and a PR URL. `suggested_change` is added to `f-debug-enabled` (settings.py `DEBUG = False`), `f-wildcard-hosts`, and `f-reflected-xss` (escaped output). One finding is left without a suggestion. `FRONTEND_ARCHITECTURE.md` is regenerated from the fixture so the sync test passes, and its severity and UI-stack notes mention the display groups.

## Risks / Trade-offs

- [The backend may name the new fields differently] → They are optional, and only the Zod schemas and `shared/api/types.ts` depend on their names. Renaming them is a local change. They are flagged as proposals in proposal.md.
- [Grouping hides the difference between high and medium] → The level stays visible as text on each card, and the ordering still uses levels.
- [The client-side score could be read as an authoritative quality metric] → It is labelled as a heuristic, hidden unless coverage is complete, and its formula is documented in the spec.
- [Original lines may not match what the model saw (for example, content fetched for a different head)] → File content is fetched per run, which pins the head SHA. If lines are missing, the block falls back to replacement-only with a note instead of guessing.
- [The Clipboard API is unavailable in insecure contexts or in jsdom] → Copy failure is handled as a normal state, and tests stub `navigator.clipboard`.
- [Markers inside line-number cells could crowd 3.5rem gutters with 4-digit numbers] → The marker is a 6px dot or bar on the cell's leading edge with an enlarged hit area, and it gets a visual check in both modes and both themes.

## Migration Plan

This is frontend-only and the fields are additive, so no data migration is needed. Removing the old `--severity-high/medium/low` tokens is the one breaking style change. Every usage is in `SeverityBadge` and is updated in the same change. Rollback is a revert of the change.

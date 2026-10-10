# Design

## Context

- **Data boundary.** `ReviewApi` (`shared/api/review-api.ts`) resolves every method with `unknown`; entity hooks parse it with Zod schemas that also map snake_case to camelCase. Only the mock adapter exists (`createMockReviewApi`), created per user in `SessionGate`. Sign-out clears the whole query cache. `query-client.ts` never retries Zod errors or 4xx responses, so a `404` or `422` surfaces at once.
- **Repository screens** (archived change `2026-10-07-add-repository-connection`) set the patterns this change follows: page-local `describe-error` helpers that never show response bodies, `role="alert"` errors with Retry, `role="status"` loading lines, `httpsUrl` for every `href`, mock fixtures in `shared/api/mock/repositories.mock.ts`, and the `?mockFail=` switch.
- **Runs.** `ReviewRunWire.repository` is the repository full name; there is no repository ID on a run. `useReviewRuns()` caches `GET /runs` under `['runs']`. The mock serves one run for `larchanka-training/dmc-268-demo`, and its state is drift-tested against `FRONTEND_ARCHITECTURE.md`.
- **Severity.** The four wire levels and the three display groups (Critical / Warning / Info) live in `entities/finding/lib/severity.ts`. ESLint enforces FSD: entity slices cannot import each other.
- **Rules.** The system design and `.agents/rules/frontend.md` make rule configuration project-scoped and versioned; runs carry `rules_version`, and the rule catalog, inheritance and format are open team decisions. The UI must not interpret `.review/rules.md` itself.
- **Navigation.** `NavList` highlights "Repositories" as the section on `/repositories/connect` with `useMatchRoute`; `aria-current` uses exact matching.

## Goals / Non-Goals

**Goals:**

- The page works fully on the mock adapter and needs only an HTTP adapter, not UI changes, once the backend exists.
- Each of the three sections loads and fails independently, so a broken rules endpoint does not hide the settings.
- Saved settings and the cache never disagree: after a save the form shows exactly what the server returned.

**Non-Goals:**

- Parsing Markdown or rule syntax in the browser.
- Editing rules, or choosing which branch rules are read from.
- Unsaved-changes navigation guards.
- Server-side pagination of the review history.

## Decisions

### 1. Four new `ReviewApi` methods, same boundary

- `getRepository(repositoryId, signal)` → `GET /repositories/{id}` → `RepositoryWire`.
- `getReviewSettings(repositoryId, signal)` → `GET /repositories/{id}/settings` → `ReviewSettingsWire`.
- `updateReviewSettings({ repositoryId, settings }, signal)` → `PUT /repositories/{id}/settings` → `ReviewSettingsWire`; `422` when rejected.
- `getRepositoryRules(repositoryId, signal)` → `GET /repositories/{id}/rules` → `RepositoryRulesWire`.

All four `404` for an unknown or unconnected repository. A dedicated `getRepository` is used instead of picking from the cached list, so a deep link or a reload does not depend on `/repositories` having loaded, and a `404` can be told apart from "still loading". `PUT` (whole settings object) instead of `PATCH`: three fields, and a full replace keeps the mock and the server semantics trivial.

_Alternative:_ derive the repository from `useRepositories()`. Rejected: a missing repository becomes indistinguishable from a list that has not refreshed.

### 2. Proposed wire contract (not approved)

```ts
type SeverityThresholdWire = 'all' | 'warning_and_critical' | 'critical_only'

interface ReviewSettingsWire {
  auto_review: boolean
  /** Target-branch patterns; `*` matches within a path segment. Empty = every branch. */
  branch_filter: string[]
  severity_threshold: SeverityThresholdWire
  updated_at: string // ISO datetime
}

type RulesFileStatusWire = 'custom' | 'missing' | 'invalid'

interface RuleWire {
  rule_id: string
  title: string
  description: string
  category: string
  severity: SeverityWire // critical | high | medium | low
  enabled: boolean
}

interface RepositoryRulesWire {
  status: RulesFileStatusWire
  path: string // '.review/rules.md'
  branch: string // the branch that was read, the default branch in v1
  commit_sha: string | null // null when missing
  file_url: string | null // https web URL of the file; null when missing
  rules_version: string
  problems: { message: string; line: number | null }[] // non-empty only when invalid
  rules: RuleWire[] // the rules in effect: parsed custom rules, or the defaults
}
```

The threshold uses the display groups the UI already shows, not a minimum wire level, so "Warning and critical" cannot be read as "high only". The backend maps it to levels (`warning_and_critical` = critical, high, medium). The schema enforces consistency: `custom` and `invalid` need a 40-hex `commit_sha` and an https `file_url`; `missing` needs both `null`; `invalid` needs at least one problem. Inconsistent payloads go to the error state rather than rendering a misleading badge.

### 3. Slices

| Slice                             | Contents                                                                                                                                                          |
| --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `shared/lib/severity.ts`          | `SEVERITIES`, `SEVERITY_LABEL`, display groups, `severityGroup` moved from `entities/finding`, which re-exports them unchanged                                    |
| `entities/repository`             | `useRepository(id)` under `['repositories', 'byId', id]` (the `byId` segment keeps an ID from colliding with `connected`/`available`)                             |
| `entities/review-settings`        | schema, `SEVERITY_THRESHOLDS` with labels and descriptions, `reviewSettingsKeys.detail(id)` = `['repositories', 'byId', id, 'settings']`, `useReviewSettings(id)` |
| `entities/review-rules`           | schema, `useRepositoryRules(id)` under `['repositories', 'byId', id, 'rules']`, `RulesStatusBadge`, `RuleList` (read-only)                                        |
| `entities/review-run`             | `runsOfRepository(runs, fullName)`                                                                                                                                |
| `features/update-review-settings` | `useUpdateReviewSettings(id)`, `parseBranchFilter`, `describeSaveError`, `ReviewSettingsForm`                                                                     |
| `pages/repository-settings`       | `RepositorySettingsPage({ repositoryId })`: header, the three sections and their states                                                                           |
| `shared/ui`                       | `switch.tsx`, `radio-group.tsx` (shadcn style over `radix-ui`)                                                                                                    |

Moving severity to `shared` is what lets `entities/review-rules` validate and label rule severity without importing `entities/finding`. Every key sits under `['repositories']`, so the existing invalidation after connecting a repository also refreshes these, and the sign-out cache clear covers them.

_Alternative:_ put settings and rules inside `entities/repository`. Rejected: it would triple that slice for data with its own lifecycle and endpoints.

### 4. Form state is local and keyed by the server value

`ReviewSettingsForm` takes the parsed settings from the query and holds a draft in `useState`. The section renders it with `key={repositoryId}`, so a draft never carries over to another repository. A successful save writes the parsed response into the cache with `setQueryData` and replaces the draft with it, so the draft equals the server value and the "Settings saved" status stays visible (re-keying on `updatedAt` would remount the form and drop that status). A failed save leaves the draft untouched. "Save" is enabled when the normalised draft differs from the server value. No Zustand: the state is one form's input.

Saving is a `useMutation`; the button is disabled while `isPending`, which with the disabled fieldset gives one request per click burst. The response is parsed with the settings schema before it reaches the cache.

### 5. Branch filter input

A `<textarea>`, one pattern per line, because patterns are short and lists are small; a chip input adds keyboard and screen-reader work for no gain. `parseBranchFilter(text)` trims lines, drops empty ones, and returns `{ patterns, problems }`, where a problem names the pattern and the reason (whitespace, longer than 255 characters, repeated). Problems render below the field with `aria-describedby` and `aria-invalid`; saving is blocked while any exist. The UI does not check glob syntax beyond that: the backend owns matching and answers `422` for what it rejects.

### 6. Rules section rendering

The badge comes from `status`: `custom` → "Custom rules", `missing` → "Default rules", `invalid` → "Rules file invalid", each with an icon and text, using the existing badge variants. The warnings use `role="note"` panels in the severity-warning colors with the exact texts from the spec. Problem messages and every rule field render as React text nodes, never as HTML, so markup in a rules file stays inert. The commit SHA is shown as its first seven characters in `<code>` with the full SHA in `title`. The preview is a `<ul>` of rule cards with `SeverityBadge`-style text ("Critical", "Low (Info)") and an "Enabled"/"Disabled" text badge, with no interactive controls.

### 7. Review history from the cached run list

The section uses `useReviewRuns()` and filters with `runsOfRepository` (exact full-name match, case-insensitive because provider names are) and `sortRunsNewestFirst`. It reuses the run list's request and cache, so opening a repository after `/runs` costs nothing. Entries reuse `RunStatusBadge` and `CoverageBadge`.

_Alternative:_ `GET /runs?repository_id=`. Better at scale and listed as the backend follow-up; the filter is isolated in `runsOfRepository` so swapping it is one hook change.

### 8. Routing and navigation

`/repositories/$repositoryId/settings`, title "Repository settings", added to the `app` route; a `RepositorySettingsRoute` in `app/ui/routes.tsx` passes `repositoryId` as a prop. `NavList` extends the "Repositories" section match to this path with `useMatchRoute({ to: '/repositories/$repositoryId/settings' })`. The `/repositories` entries get an icon "Settings" link (`SettingsIcon`, accessible name "Settings for <full name>").

### 9. Mock adapter

`repositories.mock.ts` gains `settings` and `rules` maps keyed by repository ID, and a connected repository `larchanka-training/dmc-268-demo` so the mock run shows up in a history. The fixtures cover all three rule statuses: `acme/web` custom (several rules, one disabled), `acme/billing-api` missing (defaults), `acme-group/platform/infra` invalid (two problems, one with a line), the demo repository custom. Settings start at automatic review on, empty branch filter, threshold "All", except one repository with a filter and "Warning and critical". `updateReviewSettings` stores the body with a new `updated_at` and returns `422` when a pattern contains whitespace, mirroring the client check so the error path can be exercised. Connecting a repository creates default settings and missing-file rules for it. The run state in `app-state.mock.ts` does not change.

## Risks / Trade-offs

- [The backend may parse rules into a different shape, or expose raw Markdown instead] → Only `shared/api/types.ts`, the `review-rules` schema and the adapter depend on the shape; the contract is documented as a proposal for the backend owner.
- [Filtering runs by full name breaks if a repository is renamed or two providers share a name] → Acceptable for v1 with mock data; the run list should gain a repository ID or a filtered endpoint (recorded in the docs as a backend follow-up).
- [The whole run list is fetched to show one repository's history] → Same request `/runs` already makes; replace with a filtered endpoint when one exists.
- [The rules preview can go stale after a push to the default branch] → Standard 30 s stale time and refetch on mount; a manual refresh is a later addition.
- [Moving severity helpers to `shared` touches many imports] → `entities/finding` re-exports the same names, so its consumers do not change.

## Migration Plan

Frontend only, behind the mock adapter. No data migration; rollback is reverting the change.

## Open Questions

- Should the rules be read from a branch other than the default branch (for example the branch filter's targets)? The wire contract already carries `branch`, so the UI needs no change.
- Should the threshold also hide findings below it in the run view, or only stop the reviewer reporting them? This change only stores the setting.

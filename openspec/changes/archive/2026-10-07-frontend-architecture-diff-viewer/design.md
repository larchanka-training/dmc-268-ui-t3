# Design

## Context

- The repo is a bare Vite 5 + React 18 + TS 5 starter (`src/main.tsx`, `src/App.tsx`), with strict type-aware ESLint 10, Stylelint, Prettier, Husky, and CI running check-types/lint/format/build. There is no router, no state library, no styling system, and no tests yet.
- Team stack (`.agents/rules/project-context.md`, `.agents/rules/frontend.md`): pnpm, Zod at the boundary, Zustand with selectors for shared state, Vitest. Functions take at most five parameters. Review text is rendered safely. Run lifecycle, coverage, and publication are separate fields.
- The backend API DTO is not settled. The best available shape is the LLM candidate contract in `.agents/schemas/review.schema.json` (anchor `{path, side: LEFT|RIGHT, line}`, `related_changed_lines`, `confidence`, `rule_id`, coverage `complete|partial|failed`). Per the review contract, the frontend validates an **API DTO** and not the candidate itself, so we define a local view DTO modeled on it.
- Inline comment publishing to the VCS is outside v1. Reply/resolve in this change exist only in the UI (see spec `review-findings-display`).

## Goals / Non-Goals

**Goals:**

- Set FSD conventions that are enforced by lint, so they hold up without extra review effort.
- Give components the real data flow (adapter → Zod → query cache → selectors) from day one, so swapping in the real backend means replacing one adapter.
- Build diff components that render correctly and are tested. Performance targets moderate PR sizes.

**Non-Goals:**

- Routing beyond a single review page, authentication/JWT handling, and a real HTTP client.
- Virtualized rendering for very large diffs (thousands of lines per file). The component structure allows adding it later.
- Word-level (intra-line) diff highlighting.
- Publishing replies/resolutions anywhere outside the browser session.

## Decisions

### 1. Feature-Sliced Design layout

```
src/
  app/        providers (QueryClient, theme), global styles, entry (main.tsx, App.tsx)
  pages/      review-run/             — page composition, reads runId
  widgets/    diff-viewer/            — file list, file header, hunk/gap rendering, unified/split layouts
              review-summary/         — coverage + severity counts + next/prev navigation
  features/   toggle-diff-view/       — unified/split switch
              expand-context/         — gap expansion actions
              reply-to-finding/       — reply form + mutation
              resolve-finding/        — resolve/unresolve toggle + mutation
  entities/   review-run/             — Run DTO schema, query hooks, coverage badge
              diff/                   — parsed diff model, parseUnifiedDiff, line/hunk UI atoms
              finding/                — Finding schema, FindingCard, severity badge
  shared/     ui/ (shadcn primitives, CodeBlock), lib/ (cn, highlighter, a11y helpers),
              api/ (adapter interface + mock adapter + fixtures), config/ (tokens)
```

- Every slice exposes an `index.ts`. Segments inside a slice: `ui/`, `model/`, `api/`, `lib/`.
- Why FSD over Clean Architecture: the app is mostly composed UI with thin domain logic. FSD layers match how React code actually depends on itself, and they are linted with existing tools. The user chose this.
- **Boundary enforcement** (as implemented): one `no-restricted-imports` block per layer, generated in `eslint.config.js`. Each block bans imports from higher layers, imports from other slices of the same layer, deep imports past a lower slice's `index.ts`, and relative imports that leave the slice. We tried `eslint-plugin-boundaries` v7 first and dropped it: it needs an extra TypeScript import resolver to understand the `@/` alias and a capture-based policy setup to forbid cross-slice imports. The fallback gives the same behavior with less config. `shared` has no slices, so its segment modules (`@/shared/ui/button`) are imported directly.
- Path alias `@/` → `src/` in `tsconfig.json` and `vite.config.ts`.

### 2. State split

| Kind             | Tool                                                 | Examples                                                                                                                           |
| ---------------- | ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Server state     | TanStack Query v5                                    | `['run', runId]`, `['run', runId, 'diff']`, `['run', runId, 'findings']`, `['file', runId, path, side]` (full content for context) |
| Shared client UI | Zustand (one store per concern, selector hooks only) | `useDiffViewStore`: `mode`, `collapsedFiles`, `expandedGaps: Record<gapKey, number>`; `useFindingNavStore`: `selectedFindingId`    |
| Local            | `useState`                                           | reply textarea draft, "show resolved finding" toggle                                                                               |

- TanStack Query over hand-written fetch + Zustand: query keys that include `runId` give stale-response isolation for free (spec: switching runs). It also handles retry, cache, and optimistic mutations with rollback, which the resolve-failure scenario needs. Zustand stays for shared synchronous UI state, as the team rules ask.
- `queryFn` receives `signal` and passes it to the adapter (AbortController, per team rules).
- Resolve uses optimistic update (`onMutate` snapshot → `onError` restore → `onSettled` invalidate). Reply is **not** optimistic: the spec requires that a failed reply does not appear in the thread and keeps the draft, so the draft is cleared only on success.
- `expandedGaps` is keyed by `${runId}:${path}:${gapIndex}` and reset when `runId` changes.

### 3. API adapter and DTO

- `shared/api/review-api.ts` defines `ReviewApi` (`getRun`, `getDiff`, `getFindings`, `getFileContent`, `replyToFinding`, `setFindingStatus`). `shared/api/mock/` implements it with fixtures, a configurable artificial delay, and a failure switch (so error states can be shown and tested).
- The adapter is provided through React context in `app/providers`, so tests inject a fake adapter instead of mocking modules.
- Zod schemas sit in each entity (`entities/finding/model/schema.ts`, etc.). View DTO, in camelCase on the frontend:
  - `ReviewRun { id, status: NEW|QUEUED|RUNNING|COMPLETED|FAILED|CANCELLED, coverage: { status, limitations[] }, publication: { status }, baseSha, headSha, title }`
  - `Finding { id, ruleId, title, severity, anchor{path,side,line}, relatedChangedLines[], evidence, impact, recommendation, confidence, status: open|resolved, replies: Reply[] }`
  - Diff arrives as raw unified-diff text (`getDiff` → `string`) and is parsed on the client. That matches what VCS APIs return and keeps the parser testable.
- The adapter returns wire data (`unknown`, snake_case, like the eventual backend). Each entity's query hook parses it with its Zod schema, and the schema's `.transform` maps snake_case → camelCase. That way `shared` never imports from `entities`, and a backend DTO change touches only the schemas.

### 4. Diff model and parsing

- `parseUnifiedDiff(text): Result<DiffFile[], ParseError>`. It is pure, sync, and dependency-free (about 150 lines, fully under our control). Considered: `parse-diff` / `gitdiff-parser`. They are small, but their models (no binary/rename typing we need, loose error handling) would need wrapping anyway, and the malformed-header requirement wants strict failure.
- Model: `DiffFile { oldPath, newPath, changeType: added|deleted|modified|renamed, isBinary, hunks: Hunk[] }`, `Hunk { oldStart, oldLines, newStart, newLines, header, lines: DiffLine[] }`, `DiffLine { kind: add|del|ctx, content, oldNo?, newNo? }`.
- **Rows for rendering** are derived by pure functions so both layouts share logic:
  - `buildUnifiedRows(file, expansion, fileContent?)` → `(LineRow | GapRow)[]`
  - `buildSplitRows(...)` → pairs consecutive `del` and `add` runs row by row, with `null` filler (spec scenario: 1 del + 3 add).
  - Gap rows hold `{hiddenOld: [a,b], hiddenNew: [c,d], expandable}`. Expanded context lines come from `fileContent` (the new-side file). Old numbers are computed from the hunk offset delta.
- Context step size: **20 lines** (a constant, recorded as an assumption in the spec).
- A finding anchored inside a gap: before rendering, `expansionForAnchors()` merges the minimal expansion needed to reveal each anchored line into the store.

### 5. Syntax highlighting

- **Shiki** (`shiki/core` with the JS regex engine, a fine-grained set of languages and two themes, lazily created as a singleton in `shared/lib/highlighter`). It uses `codeToTokens` and renders tokens as React `<span style={{color}}>`, so there is **no `dangerouslySetInnerHTML`**. That covers the XSS scenarios by construction.
- Highlight per file, not per line: tokenize the reconstructed old and new file text (or the hunk text when full content is missing), then map tokens to lines. This keeps multi-line constructs (block comments, template strings) correct.
- While the highlighter loads, lines render as plain text. There is no blocking spinner.
- Language comes from an extension map. An unknown extension falls back to `text`.
- Considered: Prism (`prism-react-renderer`), which is lighter and synchronous but has less accurate grammars for TSX/modern syntax and no fine-grained theming via tokens. highlight.js only outputs HTML strings, which goes against the safe-render rule.

### 6. UI stack and design tokens

- **Tailwind CSS v4** via `@tailwindcss/vite`. Tokens are defined as CSS variables in `app/styles/index.css` under `@theme`. Light/dark is done with `prefers-color-scheme` plus a `data-theme` override.
- Token groups: surface/foreground/border/muted; `diff-add-bg`, `diff-add-gutter`, `diff-del-bg`, `diff-del-gutter`, `diff-ctx-bg`, `diff-gap-bg`, `diff-highlight` (selection/flash); `severity-critical|high|medium|low` (each with a matching text color that meets ≥4.5:1 contrast); monospace font stack and a 20px line height.
- **shadcn/ui** components are generated into `src/shared/ui/` (`components.json` alias set to `@/shared/ui`): Button, Badge, Card, Collapsible, Textarea, Tooltip, ToggleGroup, ScrollArea. Copying them in means no runtime UI-kit lock-in, and they are Radix-accessible.
- The diff body is a CSS grid table (`role="table"`/`row`/`cell`). Long lines wrap instead of scrolling sideways, so the gutters and inline findings always stay in view. Each line has an `aria-label`-equivalent visually hidden prefix ("added line", "removed line"), so change type does not depend on color alone.
- Stylelint: allow Tailwind at-rules (`@theme`, `@custom-variant`, `@apply`, `@utility`) through `at-rule-no-unknown` ignore settings.

### 7. Components (public APIs, five params or fewer via props objects)

- `shared/ui/code-block`: `CodeBlock({ code, language, startLine = 1, highlightLines })`.
- `entities/diff/ui`: `DiffLineRow`, `DiffGapRow` (atoms that take a row model plus render slots).
- `entities/finding/ui`: `FindingCard({ finding, actions })`, `SeverityBadge`, `ConfidenceLabel`. `actions` is a slot, so entities never import features.
- `widgets/diff-viewer`: `DiffViewer({ runId })` composes the file list. It injects `ReplyForm` and `ResolveToggle` from features into `FindingCard.actions`, and `ExpandContextButton` into gap rows (widgets may import features).
- `widgets/review-summary`: counts, coverage badge plus limitations, next/prev.
- `pages/review-run`: loading/error/empty/partial branches plus composition.

### 8. FRONTEND_ARCHITECTURE.md and the mock state

- The doc lives at the repo root and is written in English (team rule). It contains a Mermaid layer diagram plus an ASCII fallback, the import rules table, the state split table, the UI stack/tokens, the data flow (adapter → Zod → Query → selectors → components), and a "Mock application state" section.
- The mock state is the source file `src/shared/api/mock/app-state.mock.ts`, typed as `MockAppState = { server: { run, diffText, findings, fileContents }, client: { diffView, findingNav } }`. Fixtures import their data from that file.
- To keep them in sync (spec: mock state stays in sync), a Vitest test reads `FRONTEND_ARCHITECTURE.md`, extracts the fenced block marked `<!-- mock-state:start -->…<!-- mock-state:end -->`, and asserts it equals the contents of `app-state.mock.ts`. Type-checking that file covers type drift, and the test covers doc drift.

### 9. Testing

- Vitest (jsdom), `@testing-library/react`, `user-event`, `@testing-library/jest-dom`. Config sits in `vite.config.ts` under `test`. Choose a Vitest major that supports the installed Vite 5 (Vitest 3.x).
- Unit tests: parser (each parsing scenario), row builders (split pairing, gap math, anchor expansion), and finding sort/placement.
- Component tests: CodeBlock numbering/highlight, unified vs split markers, expand gap partial/all/unavailable, inline finding placement LEFT/RIGHT, unplaced section, XSS literals, reply success/empty/fail, resolve/rollback, and keyboard expansion. Shiki is stubbed via the highlighter module so tests stay fast and deterministic.
- Add `"test": "vitest run"`. Run it in the Husky pre-push hook and in a CI step after lint.

## Risks / Trade-offs

- [Shiki bundle size (grammars/themes/WASM)] → Use `shiki/core` with the JS engine (no WASM), import only the needed languages (ts, tsx, js, jsx, json, css, html, md, py, go, java, php, yaml, sh), and lazy-load the highlighter after first paint.
- [`eslint-plugin-boundaries` may lag behind ESLint 10] → Fallback to `no-restricted-imports` as described in Decision 1. Check this during the first setup task.
- [Tailwind v4 / Vitest versions vs Vite 5] → Pin versions whose peer ranges include Vite 5. Upgrading Vite is out of scope.
- [Local view DTO diverges from the eventual backend DTO] → Keep the mapping inside the adapter only, and keep enum values identical to the review contract.
- [Large diffs render slowly without virtualization] → Files are collapsible, and files over a line threshold (e.g. 1,000 changed lines) start collapsed. Virtualization is recorded as a follow-up.
- [Reply/resolve may be mistaken for VCS comments] → The UI copy states that discussion is local to the review UI (spec: UI-only discussion state).

## Migration Plan

Greenfield UI, no users. Move `main.tsx`/`App.tsx` to `src/app/`, update `index.html`'s script path, and keep the CI/Docker build unchanged apart from the new test step. Rollback means reverting the PR.

## Open Questions

- Final backend endpoint shapes and auth. These only affect the adapter, not components or specs.
- Whether the step of 20 context lines should become user-configurable.

# Tasks

## 1. Tooling and dependencies

- [x] 1.1 Add runtime deps (`@tanstack/react-query`, `zustand`, `zod`, `shiki`, `clsx`, `tailwind-merge`, `class-variance-authority`, `lucide-react`, needed `@radix-ui/*`) and dev deps (`tailwindcss`, `@tailwindcss/vite`, `vitest` 3.x, `jsdom`, `@testing-library/react`, `@testing-library/user-event`, `@testing-library/jest-dom`, `eslint-plugin-boundaries`), with peer ranges compatible with Vite 5. Verify with `pnpm install` and no peer-dependency errors
- [x] 1.2 Add the `@/` → `src/` alias to `tsconfig.json` (`paths`) and `vite.config.ts`. Verify `pnpm check-types` passes with an `@/` import
- [x] 1.3 Configure Vitest in `vite.config.ts` (jsdom, setup file loading jest-dom), add `"test": "vitest run"` to `package.json`, and add one smoke test. Verify `pnpm test` passes
- [x] 1.4 Add Tailwind v4 via `@tailwindcss/vite`, create `src/app/styles/index.css` with `@import "tailwindcss"`, and update `stylelint.config.js` to allow Tailwind at-rules. Verify `pnpm lint` and `pnpm build` pass and a utility class applies in `pnpm dev`
- [x] 1.5 Initialize shadcn (`components.json` with aliases to `@/shared/ui` and `@/shared/lib`) and generate Button, Badge, Card, Collapsible, Textarea, Tooltip, ToggleGroup, ScrollArea into `src/shared/ui/`. Verify generated files pass `pnpm lint` and `pnpm check-types`
- [x] 1.6 Add `pnpm test` to `.husky/pre-push` and to the CI `checks` job after lint. Verify the workflow YAML is valid and the hook runs the tests locally

## 2. FSD skeleton and boundary enforcement

- [x] 2.1 Create layer folders `app, pages, widgets, features, entities, shared` with the slices from design §1 and an `index.ts` per slice. Move `main.tsx`/`App.tsx` into `src/app/` and update the `index.html` script path. Verify `pnpm dev` renders and `pnpm build` passes
- [x] 2.2 Configure `eslint-plugin-boundaries` (layer order, no cross-slice imports, entry-point-only imports). Use the `no-restricted-imports` fallback if it is incompatible with ESLint 10. Verify with temporary violating imports (entity→feature, feature→feature, deep import) that each fails `pnpm lint`, and that a widget→entity/shared import passes. Then remove the probes
- [x] 2.3 Add design tokens (surface, diff add/del/ctx/gap/highlight, severity colors with ≥4.5:1 text contrast, mono font, line height) under `@theme` with light/dark variants in `app/styles/index.css`. Verify both themes render in `pnpm dev` and spot-check contrast of the severity text tokens

## 3. API boundary, mock adapter, and server/client state

- [x] 3.1 Define the `ReviewApi` interface in `shared/api` and a React context provider for it. Add `QueryClientProvider` and `ReviewApiProvider` in `app/providers`. Verify `pnpm check-types` passes
- [x] 3.2 Create `shared/api/mock/app-state.mock.ts` (typed `MockAppState`: run with partial coverage, multi-file unified diff text including rename/added/binary files, findings on LEFT/RIGHT/context/unmatched anchors, file contents) and a mock adapter with configurable delay, failure switch, and `signal` support. Verify with unit tests that the adapter returns fixtures, rejects when failure is on, and aborts on signal
- [x] 3.3 Add Zod schemas with snake→camel transforms in `entities/review-run` and `entities/finding`, plus query hooks keyed by `runId` that pass `signal`. Verify with tests that a valid payload parses, that an invalid severity leads to an error state with no findings rendered, and that switching run A→B with A slower only shows B
- [x] 3.4 Create Zustand stores `useDiffViewStore` (mode, collapsedFiles, expandedGaps, reset on runId change) and `useFindingNavStore` (selectedFindingId), exposed only through selector hooks. Verify store unit tests for each action and the reset

## 4. Diff parsing and row model (`entities/diff`)

- [x] 4.1 Implement `parseUnifiedDiff` returning `Result<DiffFile[], ParseError>`. Verify unit tests for hunk line numbering (`@@ -10,3 +10,4 @@` scenario), added/deleted/renamed/binary files, multiple hunks/files, `\ No newline at end of file`, and malformed header → error
- [x] 4.2 Implement `buildUnifiedRows` and `buildSplitRows` with gap rows (before first hunk, between hunks, after last hunk; expandable only when file content exists). Verify unit tests for split pairing (1 del + 3 add → filler cells), gap line ranges, and old/new numbers of expanded lines
- [x] 4.3 Implement `expansionForAnchors` (minimal expansion that reveals anchored context lines) and anchor→row matching that returns unplaced anchors. Verify unit tests for an anchor inside a gap, an anchor on a changed line, and an anchor beyond file end → unplaced

## 5. Code rendering and syntax highlighting

- [x] 5.1 Implement the lazy Shiki singleton in `shared/lib/highlighter` (core and JS engine, design's language list, light/dark themes, extension→language map with `text` fallback) and a `useHighlightedLines(code, lang)` hook that returns tokens per line with a plain-text fallback while loading. Verify unit tests for the language mapping, the unknown→text fallback, and multi-line comment tokens mapped to correct lines
- [x] 5.2 Build `shared/ui/code-block` `CodeBlock({ code, language, startLine, highlightLines })` that renders tokens as React spans (no `dangerouslySetInnerHTML`). Verify component tests for numbering 40–44 with line 42 highlighted, and that an `<img onerror>` string renders literally

## 6. Diff viewer widget

- [x] 6.1 Build `DiffLineRow` and `DiffGapRow` atoms in `entities/diff/ui` (gutters, `+`/`-` markers, token backgrounds, visually hidden change-type label, `role` table semantics). Verify component tests that added/removed/context lines expose markers and accessible change type
- [x] 6.2 Build `widgets/diff-viewer` with the file header (path, old → new for renames, change type, +/- counts, collapsible, binary notice, large files collapsed by default) and the unified layout using syntax-highlighted rows. Verify component tests for the header for each change type, collapse/expand, and the binary notice
- [x] 6.3 Add the split layout (LEFT/RIGHT columns, filler cells) and the `features/toggle-diff-view` ToggleGroup bound to the store. Verify component tests that the toggle switches all files and keeps expanded gaps and findings
- [x] 6.4 Add `features/expand-context` (expand 20 / expand all, keyboard operable, disabled with hidden count when content is unavailable) wired to `expandedGaps` and `getFileContent`. Verify component tests for 50-line gap → 20 shown / 30 remaining, expand all removes the control, the unavailable-content case, and Enter key activation

## 7. Inline findings

- [x] 7.1 Build `entities/finding/ui` `FindingCard` (title, severity badge with text label, rule id, evidence, impact, recommendation, confidence % labeled "model estimate", related-lines list, `actions` slot) rendering all text as plain text. Verify component tests for the "High" label and a `<script>` literal in evidence
- [x] 7.2 Place findings under their anchor rows in unified and split modes (side column in split, severity-sorted when several), auto-expand gaps for context anchors, and render the per-file "unplaced findings" section. Verify component tests for each `review-findings-display` placement scenario
- [x] 7.3 Implement related-line navigation (scroll into view and temporary highlight token). Verify a component test that activating a reference marks the target row highlighted and calls `scrollIntoView`

## 8. Reply and resolve features

- [x] 8.1 Add `replyToFinding`/`setFindingStatus` to the mock adapter (mutating in-memory fixture state). Verify adapter unit tests for success and forced failure
- [x] 8.2 Build `features/reply-to-finding` (textarea, submit disabled for blank input, non-optimistic mutation, clear draft on success only, error message on failure) and render the reply thread with author/time in `FindingCard`. Verify component tests for successful, empty, and failed reply
- [x] 8.3 Build `features/resolve-finding` (resolve/unresolve toggle with optimistic update and rollback on error) and the collapsed resolved state with an expand control and unchanged content. Add UI copy stating that discussion is local to the review UI. Verify component tests for resolve, unresolve, failed-resolve rollback, and content unchanged after resolve

## 9. Review summary and page

- [x] 9.1 Build `widgets/review-summary` (counts by severity, resolved/unresolved counts, coverage badge with limitations, next/prev finding bound to `useFindingNavStore`). Verify component tests for counts, partial-coverage limitations, and next from 2/5 → 3 selected and scrolled
- [x] 9.2 Build `pages/review-run` with loading, error (retry), empty-with-complete-coverage, partial/failed coverage (never "no issues") states, and the composed viewer, and render it from `App`. Verify page tests for each state using the injected fake adapter

## 10. Architecture document

- [x] 10.1 Write `FRONTEND_ARCHITECTURE.md` at the repo root (English): Mermaid + ASCII layer diagram, import rules table, slice map, state split table and data flow, UI stack and tokens, component catalog, testing approach, and a "Mock application state" section containing `app-state.mock.ts` between `<!-- mock-state:start -->` / `<!-- mock-state:end -->` markers. Link it from `README.md` (in Russian). Verify `pnpm format:check` passes and the doc renders on GitHub
- [x] 10.2 Add a Vitest test that extracts the marked block from `FRONTEND_ARCHITECTURE.md` and asserts it equals `src/shared/api/mock/app-state.mock.ts`. Verify it passes, and that it fails after a deliberate one-character change to the mock (then revert)

## 11. Integration verification

- [x] 11.1 Run `pnpm check-types && pnpm lint && pnpm format:check && pnpm test && pnpm build` and verify all pass with zero warnings
- [x] 11.2 Manually check in `pnpm dev`: unified/split toggle, expanding context, inline findings on both sides, reply/resolve including the forced-failure switch, keyboard-only navigation, and light/dark themes. Record the results in the PR description

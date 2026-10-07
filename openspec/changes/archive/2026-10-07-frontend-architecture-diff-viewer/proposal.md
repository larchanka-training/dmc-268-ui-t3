# Proposal

## Why

The UI for the AI code-review bot is still a Vite starter (`src/App.tsx` is a counter). The team needs a set layer structure, a chosen state and UI stack, and the core building block of the product, a diff viewer that shows AI findings next to changed lines, before feature work can run in parallel without conflicting conventions. The DoD for this task is a `FRONTEND_ARCHITECTURE.md` with a layer diagram and a mocked app state, plus working base components for code blocks and diffs.

## What Changes

- Add `FRONTEND_ARCHITECTURE.md` at the repo root. It describes the Feature-Sliced Design layers (`app / pages / widgets / features / entities / shared`), the import rules between them, how state is split between server-cache and client state, and a typed mock of the application state for one review run.
- Restructure `src/` into FSD layers with public-API `index.ts` files. Add an ESLint rule that enforces import boundaries between layers.
- Add the state stack: TanStack Query for server state (runs, diffs, findings) and Zustand for shared client UI state (view mode, expanded hunks, selected finding). Validate API data with Zod at the boundary.
- Add the UI stack: Tailwind CSS v4 with design tokens (colors for added/removed/context lines and severities, plus light/dark), and shadcn/ui primitives (Radix) copied into `shared/ui`.
- Add a mock API adapter that serves fixture data (review run, unified diff, findings) through the same query functions a real backend client will use, so components are built against the real data flow.
- Add the diff and code components:
  - `CodeBlock`: a read-only code snippet with line numbers, syntax highlighting, and optional highlighted lines.
  - `DiffViewer`: parses a unified diff into files, hunks, and lines, and renders it in **unified** or **split** (side-by-side) mode with old/new line numbers and add/remove/context styling.
  - Syntax highlighting of diff lines that keeps the add/remove background.
  - Expandable context: collapsed gaps between hunks that the user can reveal step by step or all at once.
  - Inline reviewer findings anchored to `path` + `LEFT|RIGHT` + `line`, showing severity, rule, evidence, suggestion, and confidence. Users can **reply** to a finding and **resolve/unresolve** it, using mock mutations for now.
- Add Vitest + Testing Library with unit tests for diff parsing and component tests for the diff and finding components. Wire `pnpm test` into the pre-push hook and CI.
- Replace the starter `App` with a review page that composes these pieces using the mock data.

## Capabilities

### New Capabilities

- `frontend-architecture`: the layer structure and import boundaries of the frontend, the split between server and client state, and the architecture document with its mock application state.
- `code-diff-viewer`: rendering code snippets and unified/split diffs with line numbers, change highlighting, syntax highlighting, and expandable context.
- `review-findings-display`: showing AI review findings inline on diff lines, plus the reply and resolve interactions on those findings.

### Modified Capabilities

None. `openspec/specs/` is empty.

## Impact

- **Code**: `src/` is restructured. `App.tsx` and `main.tsx` move under `src/app/`. `index.html` keeps its entry point (path updated).
- **Dependencies (new)**: `@tanstack/react-query`, `zustand`, `zod`, `tailwindcss` + `@tailwindcss/vite`, Radix primitives / `class-variance-authority` / `clsx` / `tailwind-merge` / `lucide-react` (shadcn), a syntax highlighter (`shiki`), a lint plugin for FSD boundaries, and `vitest`, `@testing-library/react`, `@testing-library/user-event`, `jsdom` (dev).
- **Tooling**: `vite.config.ts` gets the Tailwind plugin, a `@/` path alias, and the Vitest config. `tsconfig.json` gets `paths`. ESLint gets the boundary rule. Stylelint needs to accept Tailwind at-rules. CI and the Husky pre-push hook gain `pnpm test`.
- **APIs**: none consumed yet. The backend DTO is not settled (see `.agents/rules/project-context.md`), so the frontend defines a local view DTO and a Zod schema behind an API adapter. Reply/resolve are mocked on the client, and **v1 publishing of inline comments to the VCS is still out of scope**. These interactions are UI-only until the backend owns them.

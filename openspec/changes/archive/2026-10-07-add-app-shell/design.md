# Design

## Context

- **Current routing.** `app/App.tsx` switches on `resolveRoute(pathname)`:
  - `/auth/callback` goes to `AuthCallbackPage`;
  - everything else goes to `SessionGate`, which shows a "Loading…" text, then `SignInPage` or `SignedInShell` (a header line plus `ReviewRunPage`).
  - The run comes from `?run=`. Navigation after the callback is a `useState` pathname plus `window.history.replaceState`.
- **Theming already exists in CSS.** `src/app/styles/index.css` defines every token on `:root`. Dark values apply under `prefers-color-scheme: dark` unless `<html data-theme="light">` is set, and `[data-theme="dark"]` forces dark. The Shiki tokens (`.code-token`) and the Tailwind `dark` variant follow the same rule. Nothing sets `data-theme` yet, and `color-scheme` is not declared, so native scrollbars and form controls ignore the theme.
- **Building blocks.**
  - FSD layers are enforced by ESLint.
  - shadcn primitives in `shared/ui` come from the `radix-ui` umbrella package, which already includes dialog, dropdown-menu, separator and avatar.
  - `lucide-react` is installed.
  - `ToggleGroup` and `Tooltip` already exist.
- **Data.**
  - `ReviewApi` has no list method.
  - The mock serves one run (`state.run`).
  - `FRONTEND_ARCHITECTURE.md` mirrors `app-state.mock.ts`, and a test fails if they drift, so the mock state's shape should not change.
- **Hosting.** nginx and Vite already serve `index.html` for unknown paths, so deep links like `/runs/abc` work without server changes.

## Goals / Non-Goals

**Goals:**

- One route tree that owns every URL: auth gating, legacy redirects and not-found.
- A shell widget that pages slot into, so pages don't know about the chrome.
- A theme mechanism that reuses the existing CSS contract: JS only sets or removes `data-theme`.

**Non-Goals:**

- File-based routing and its code generation.
- Route-level code splitting (all pages are small; revisit when Repositories/Rules land).
- Syncing the theme or sidebar state across open tabs.
- Breadcrumbs, search, notifications.
- Loading data in route loaders. Pages keep using TanStack Query hooks.

## Decisions

### 1. TanStack Router with a code-based route tree in `app/`

```
rootRoute (Outlet, theme root effects, document title)
├── /auth/callback            → AuthCallbackPage          (public, no shell)
└── _app  (pathless layout)   → SessionGate → AppShell + <Outlet/>
    ├── /            beforeLoad: ?run=<id> → redirect /runs/<id> (replace) else /runs
    ├── /runs        → ReviewRunsPage            staticData.title "Review runs"
    ├── /runs/$runId → ReviewRunPage(runId)      staticData.title "Review run"
    ├── /settings    → SettingsPage              staticData.title "Settings"
    └── notFoundComponent → NotFoundPage (inside the shell)
```

- `app/router.tsx` builds the tree with `createRoute`/`createRouter` and declares `Register` for type-safe `Link`/`useParams` in every layer. Route context carries `queryClient`. `createAppRouter({ history })` takes the history, so tests use `createMemoryHistory`.
- **Why code-based:** file-based routing needs the Vite plugin and a generated `routeTree.gen.ts` under `src/routes`, which sits outside the FSD layers and their lint rules. Five routes do not justify that. Alternative considered: React Router (less type-safe params). The user chose TanStack Router.
- **Gating stays a component**, not `beforeLoad`. The session restore is an async store transition that `SessionGate` already handles, including the skeleton. `beforeLoad` would need to await the restore promise and would duplicate that logic. Because child `beforeLoad` hooks run before the layout renders, the legacy redirect happens **before** the gate. A signed-out user on `/?run=abc` sees sign-in at `/runs/abc`, and `startGithubSignIn` saves `/runs/abc` as the return path. That matches the modified auth scenario.
- **Callback navigation.** `AuthCallbackPage` receives `onSignedIn(returnTo)` from the route component, which calls `router.history.replace(returnTo)`. `useCompleteSignIn` stops calling `replaceState` for the final navigation, so the router stays the single owner of navigation. The early query strip before the exchange stays as `window.history.replaceState`, because it must happen synchronously before any await. The route's next `replace` brings the router back in sync.
- `routing.ts` and `routing.test.ts` are deleted. `SignedInShell` is split up: `useSessionRefreshScheduler` and the per-user `ReviewApiProvider` move into the `_app` layout component, and the chrome moves into the widget.
- **Document title:** each route sets `staticData.title`. A root effect reads the deepest match through `useRouterState` and sets `document.title = "<title> · AI code review"`.

### 2. `widgets/app-shell`

- `AppShell({ children })` provides:
  - the skip link (`href="#main"`, visible on focus);
  - the `Sidebar` (`nav aria-label="Main"`);
  - the `Header` (`header`, page title, mobile menu button, `ThemeMenu`, auth status);
  - `main#main tabIndex=-1`.
- **Sidebar** uses `Link` with `activeProps` → `aria-current="page"`. "Review runs" is active for `/runs` and `/runs/*` through `activeOptions: { exact: false }`, while the nested run item uses an exact match. The nested run label comes from `useReviewRun(runId)`, which is already cached by the page, with the run ID as fallback text while it loads. `runId` is read through `useParams({ strict: false })`.
- **Collapse** state lives in a small Zustand store in `widgets/app-shell/model`, persisted to `localStorage['dmc268.sidebar']` behind a guarded try/catch. When collapsed, the rail shows icons with `Tooltip` labels, and each link keeps an `aria-label`.
- **Narrow screens** (`< md`, CSS only): the sidebar is `hidden md:flex`, and the header shows a menu button that opens a shadcn `Sheet` (Radix Dialog, side left) rendering the same nav list. Radix handles focus trapping and returns focus to the trigger. The sheet closes on navigation by watching `location.pathname`.
- **`ShellSkeleton`:** the same grid with muted blocks and a `role="status"` "Restoring your session…" label. `SessionGate` renders it instead of the current "Loading…" text.

### 3. Auth status in the header

`features/auth-by-github/UserMenu` becomes a shadcn `DropdownMenu`:

- the trigger is the avatar plus the login (only the avatar on small screens) and has an accessible name;
- the content shows the display name and `@login`, a separator, "Settings" (a `Link`), and "Sign out", using the existing logout logic.

The widget shows a "Mock auth" `Badge` next to it when `authMode === 'mock'`. The widget can't read env config through `app`, so `AppShell` receives `authMode` as a prop from the `_app` layout.

### 4. Theme: `shared/lib/theme` + `features/switch-theme`

- `shared/lib/theme/theme.ts`:
  - `type ThemePreference = 'light' | 'dark' | 'system'`;
  - `THEME_STORAGE_KEY = 'dmc268.theme'`;
  - `readStoredTheme()` (guarded, falls back to `system`);
  - `applyTheme(pref)`: sets `data-theme` for `light`/`dark` and **removes** it for `system`;
  - a vanilla Zustand `themeStore` with `setPreference` (persist + apply) and `useThemePreference()`.
- **System needs no JS listener.** With no attribute, the existing `prefers-color-scheme` CSS rules apply and follow OS changes live. That is less code and has no matchMedia edge cases.
- **Before first paint:** an inline `<script>` in `index.html` `<head>` reads the same key inside try/catch and sets `data-theme` for `light`/`dark`. A unit test reads `index.html` and checks that the key in the script equals `THEME_STORAGE_KEY`, so the two can't drift. Alternative considered: applying the theme in `main.tsx` before render. Rejected, because the CSS and HTML paint before the module bundle runs, which causes a visible flash on slow loads.
- **`color-scheme`:** add `color-scheme: light` on `:root`, and `dark` under the same selectors as the dark tokens, so scrollbars and native inputs match.
- **`features/switch-theme`:**
  - `ThemeMenu` is a header icon button (Sun/Moon/Monitor showing the _preference_) with a `DropdownMenuRadioGroup`;
  - `ThemeToggleGroup` is a labelled segmented control built on the existing `ToggleGroup`, for Settings and the sign-in page.
  - Both read and write `themeStore`, so they stay in sync.

### 5. Run list

- `ReviewApi.listRuns(signal)` resolves with `ReviewRunWire[]`. The mock returns `[state.run]` (no change to the mock state shape, so the architecture doc's mock block stays valid). The interface comment notes that the real endpoint is `GET /runs`.
- `entities/review-run` adds `reviewRunListSchema = z.array(reviewRunSchema)`, `reviewRunKeys.list = ['runs']`, and `useReviewRuns()`. Sorting newest-first is a pure `sortRunsNewestFirst` in the entity's `lib`. The list key deliberately does not start with `['run', runId]`; the existing "key by run" rule covers per-run data.
- `pages/review-runs` renders the list with the existing `RunStatusBadge`/`CoverageBadge`, plus loading, empty and error-with-retry states (the same pattern and `describeError` approach as `ReviewRunPage`).

### 6. Settings and not-found pages

- `pages/settings` has two sections, Appearance (`ThemeToggleGroup`) and Account (the session user, auth mode). `authMode` is passed as a prop from the route.
- `pages/not-found` shows "Page not found" with a `Link` to `/runs`.

## Risks / Trade-offs

- [Router plus a pathless layout means tests need a router] → An `app/test/render-route.tsx` helper builds `createAppRouter({ history: createMemoryHistory({ initialEntries: [path] }) })` with injected `authApi`/`createReviewApi`/`queryClient`. Pages that use `Link` get a minimal `renderWithRouter` in `shared/lib/test`.
- [`window.history.replaceState` in the callback hook runs behind the router's back] → It only removes the query from the current entry, and the route then calls `router.history.replace(returnTo)`. A test checks that the router location matches `window.location` after sign-in.
- [Bundle size] → `@tanstack/react-router` adds roughly 15 KB gzip. That's acceptable next to Shiki, which is already lazy-loaded.
- [An inline script in `index.html` blocks a future strict CSP] → It is small and static. A CSP can allow it by hash later. Recorded here for whoever adds a CSP.
- [The nested sidebar item depends on run data] → It falls back to the run ID until the query resolves, and it never blocks navigation.

## Migration Plan

Frontend-only and shipped in one deploy. Old `/?run=<id>` links redirect. The nginx SPA fallback already serves the new paths. Rollback is a plain revert. Stored theme and sidebar keys are harmless if the code is reverted.

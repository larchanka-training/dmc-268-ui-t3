# Tasks

## 1. Dependencies and primitives

- [x] 1.1 Add `@tanstack/react-router` (v1) with `pnpm add`. Verify that `pnpm install --frozen-lockfile` passes and `pnpm check-types` still passes
- [x] 1.2 Add the shadcn primitives `dropdown-menu`, `sheet` and `separator` to `shared/ui`, built on the `radix-ui` umbrella package with variants in `*-variants.ts` where needed (as the existing primitives do). Verify that `pnpm lint` passes with zero warnings
- [x] 1.3 Add `renderWithRouter(ui, { path, ...providerOptions })` to `shared/lib/test`. It wraps a component in a memory-history router plus the existing providers, for component tests that use `Link`. Verify with a small test that renders a `Link` and checks its `href`

## 2. Theme switching

- [x] 2.1 Implement `shared/lib/theme`: `ThemePreference`, `THEME_STORAGE_KEY`, a guarded `readStoredTheme`, `applyTheme` (sets or removes `<html data-theme>`), a vanilla `themeStore` with `setPreference` (persist + apply), and `useThemePreference`. Verify with tests covering the default `system`, invalid stored values, storage that throws, `system` removing the attribute, and persisting and applying a choice
- [x] 2.2 Add the pre-paint inline script to the `index.html` `<head>`. It reads the key in try/catch and sets `data-theme` for `light`/`dark` only. Initialize `themeStore` from storage in `main.tsx`. Verify with a test that reads `index.html`, checks that the script's key equals `THEME_STORAGE_KEY`, and runs the script against a stored `dark` value to show it sets the attribute
- [x] 2.3 Declare `color-scheme` in `index.css` (`light` on `:root`, `dark` under the same selectors as the dark tokens). Verify that `pnpm lint` (Stylelint) passes, and check in the browser that scrollbars are dark in the dark theme
- [x] 2.4 Implement `features/switch-theme`. `ThemeMenu` is a header icon button with a radio-group dropdown whose icon shows the current preference. `ThemeToggleGroup` is a labelled segmented control. Verify with component tests: selecting Dark sets `data-theme="dark"`, the selection is marked, choosing in one switcher updates the other, and the menu works with the keyboard

## 3. Run list data

- [x] 3.1 Add `listRuns(signal)` to `ReviewApi` (documented as `GET /runs`). The mock returns `[state.run]` without changing the mock state's shape, and `listRuns` joins `failuresFromSearch`. Verify with mock adapter tests, and check that `app-state.mock.test.ts` still passes
- [x] 3.2 Add `reviewRunListSchema`, `reviewRunKeys.list`, `useReviewRuns()` and `sortRunsNewestFirst` to `entities/review-run`, exported from its `index.ts`. Verify with tests: parsing and sorting, an invalid payload moving the query into the error state, and the AbortSignal being passed through

## 4. Pages and auth UI

- [x] 4.1 Add `pages/review-runs`. Each list entry shows the title, `repository#PR`, the run status and coverage badges, and the creation time, and links to `/runs/$runId`. The page has loading, empty ("No review runs yet") and error-with-Retry states. Verify with component tests through `renderWithRouter` covering each state, newest-first order and the link `href`s
- [x] 4.2 Add `pages/settings` with an Appearance section (`ThemeToggleGroup`) and an Account section (avatar, login, display name, and auth mode with a mock-mode note). `authMode` comes in as a prop. Verify with a component test for `octocat` in mock mode
- [x] 4.3 Add `pages/not-found` with "Page not found" and a link to "Review runs". Verify with a component test for the link target
- [x] 4.4 Turn `UserMenu` into a `DropdownMenu`. The trigger shows the avatar and login and has an accessible name. The menu shows the name, `@login`, a separator, a Settings link and "Sign out", using the existing logout logic. Update the existing UserMenu tests to open the menu first, add a keyboard-operation test, and verify they pass
- [x] 4.5 Add `ThemeToggleGroup` to the sign-in page (and to the configuration-error state). Verify with a SignInPage test that the switcher is present

## 5. App shell widget

- [x] 5.1 Add the sidebar collapse store to `widgets/app-shell/model`, persisted in `localStorage['dmc268.sidebar']` with guarded access. Verify with tests: collapse survives a store re-read, and storage that throws defaults to expanded
- [x] 5.2 Implement `Sidebar`:
  - the `nav aria-label="Main"` with "Review runs" and "Settings" `Link`s and lucide icons;
  - `aria-current="page"` on the active link, with Review runs active on `/runs/*`;
  - the nested open-run item, labelled from `useReviewRun` with the run ID as fallback;
  - the collapsed rail with tooltips and `aria-label`s.

  Verify with tests through `renderWithRouter` on `/settings`, `/runs` and `/runs/<RUN_ID>`, plus one in the collapsed state

- [x] 5.3 Implement `Header` with the page title from the deepest route's `staticData.title`, a mobile menu button (`md:hidden`) that opens the `Sheet` drawer with the same nav list (closing on navigation and on Escape, and returning focus), `ThemeMenu`, a "Mock auth" badge when `authMode === 'mock'`, and `UserMenu`. Verify with tests: drawer open, navigate, closed with focus restored; badge present in mock mode and absent in github mode
- [x] 5.4 Implement `AppShell` (skip link to `#main`, sidebar, header, `main#main` with `tabIndex=-1`) and `ShellSkeleton` (the same grid, `role="status"` "Restoring your session…"). Export them from `widgets/app-shell/index.ts`. Verify with tests: the three landmarks are present, Tab focuses the skip link first and activating it focuses main, and the skeleton announces its status. `pnpm lint` must pass the FSD rules

## 6. Router and app wiring

- [x] 6.1 Create `app/router.tsx` with `createAppRouter({ history, context })`:
  - the root route, `/auth/callback`, and the pathless `_app` layout with `/`, `/runs`, `/runs/$runId`, `/settings` and a `notFoundComponent`;
  - `staticData.title` on each route;
  - the `Register` declaration.

  Verify `pnpm check-types` passes

- [x] 6.2 Have the `_app` layout render `SessionGate`, which shows `ShellSkeleton` while restoring, `SignInPage` when signed out, and otherwise the per-user `ReviewApiProvider` + `useSessionRefreshScheduler` + `AppShell` around `<Outlet/>`. Delete `SignedInShell`, `routing.ts` and `routing.test.ts`. Verify that the existing App gate tests are ported to `createMemoryHistory` and pass
- [x] 6.3 Add redirects to the index route's `beforeLoad`: `?run=<id>` goes to `/runs/<id>`, otherwise `/runs`, both with `replace: true`. Verify with app tests: `/` → `/runs`; `/?run=<RUN_ID>` → `/runs/<RUN_ID>` showing the run; a signed-out `/?run=abc` shows sign-in at `/runs/abc`
- [x] 6.4 Change the callback flow so the route's `onSignedIn` calls `router.history.replace(returnTo)`, and drop the final `replaceState` from `useCompleteSignIn`. Update its tests. Verify with an app test: start on `/runs/<RUN_ID>` signed out, complete the mock callback, land on `/runs/<RUN_ID>` with the run shown, and the router location equals `window.location`
- [x] 6.5 Add a root effect that sets `document.title` to `"<staticData.title> · AI code review"`. Verify with an app test that `/settings` gives "Settings · AI code review"
- [x] 6.6 Verify the not-found page in an app test: a signed-in `/nope` shows "Page not found" inside the shell, and the link goes to `/runs`

## 7. Documentation

- [x] 7.1 Update `FRONTEND_ARCHITECTURE.md`:
  - a Routes section with the route tree, the legacy redirect and the gating order;
  - an App shell section with its regions and responsive behavior;
  - a Theming section covering the preference store, the pre-paint script, the `data-theme` contract and `color-scheme`;
  - the new slices in the layer table and diagram;
  - the new components in the Components table;
  - `listRuns` in the API adapter text.

  Verify `pnpm format:check` passes and the mock-state drift test still passes

## 8. Integration checks

- [x] 8.1 Run `pnpm check-types && pnpm lint && pnpm test && pnpm format:check && pnpm build` and verify that all pass
- [x] 8.2 Browser check with `pnpm dev` (mock mode):
  - sign in from `/?run=<RUN_ID>` and land on `/runs/<RUN_ID>`;
  - navigate Runs ↔ Settings without reloads, with the active item and the title updating;
  - collapse the sidebar and reload, and it stays collapsed;
  - at a narrow width, the drawer opens and closes with focus restored;
  - Dark → reload shows no flash and dark scrollbars;
  - System follows the OS toggle;
  - sign out from the user menu;
  - `/nope` shows not-found.
- [x] 8.3 Production build check with `pnpm preview`: a deep link to `/runs/<RUN_ID>` and a reload on `/settings` both load through the SPA fallback

## Workflow follow-up

- When the backend implements `GET /runs`, add it to the HTTP `ReviewApi` together with the other review endpoints.
- Archive the change after review.

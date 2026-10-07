# Proposal

## Why

The signed-in UI is a single review run page under a thin header, reached through a `?run=` query string. There is no way to move between screens, no place for app-wide controls, and no visible theme control, even though the design tokens already support light and dark. Upcoming screens (run history, settings, later repositories and rules) need a stable frame now: a persistent layout with navigation, a visible sign-in status, and a theme switcher, so new pages plug in instead of each one building its own chrome.

## What Changes

- Add an **app shell** for signed-in users with these parts:
  - a **sidebar** with the primary navigation (Review runs, Settings) and the open run shown as a nested item;
  - a **header** with the page title, the theme switcher and the user menu;
  - a **main content area**.
- The sidebar collapses to icons on desktop (the choice is remembered) and becomes an off-canvas drawer on narrow screens.
- Add **URL-based navigation** with TanStack Router:
  - `/` redirects to `/runs`;
  - `/runs` is the new run list;
  - `/runs/$runId` is the existing review run page;
  - `/settings`;
  - `/auth/callback`;
  - a not-found page.
  - Legacy `/?run=<id>` links redirect to `/runs/<id>`.
  - The hand-written `resolveRoute` switch is replaced.
- Add a **Review runs list page**. It is backed by a new `ReviewApi.listRuns()` method, served by the mock from its existing run data, and has loading, empty and error states.
- Add a **Settings page**: theme preference and account details (GitHub login, auth mode). It is the placeholder for later settings.
- Show **auth status** in the header:
  - the avatar and login open a menu with the GitHub profile name and a sign-out action;
  - a "Mock auth" badge appears when `VITE_AUTH_MODE=mock`;
  - while the session is being restored, the shell shows a skeleton instead of a blank screen.
- Add a **theme switcher** with Light / Dark / System:
  - the preference is persisted per browser and applied through the existing `<html data-theme>` hook;
  - it is applied before first paint, so a reload doesn't flash the wrong theme;
  - System follows OS changes live;
  - the sign-in page has the switcher too.

Out of scope: real backend endpoints for listing runs, the Repositories and Rules pages, search, notifications, i18n of the shell.

## Capabilities

### New Capabilities

- `app-shell`: the signed-in application frame. Covers the layout regions, primary navigation and its active state, responsive sidebar behavior, URL routes and legacy redirects, the run list and settings destinations, the not-found page, and the header's auth status display.
- `theme-switching`: the user's color theme preference (light, dark, system). Covers persistence, applying it before first paint, following OS changes, and availability on signed-in and signed-out screens.

### Modified Capabilities

- `github-auth-client`: the "Sign-in redirect" requirement's return-path scenario names the legacy URL `/?run=abc`. Under the router, the user returns to the run's canonical URL (`/runs/abc`), and legacy links still end up there. The other auth requirements are unchanged. frontend-architecture's layering rules apply unchanged to the new slices.

## Impact

- **Dependencies**: adds `@tanstack/react-router` (v1, React 18 compatible).
- **Code**:
  - `app/` gets a router setup (route tree, auth layout, legacy redirect) that replaces `routing.ts`, and `SignedInShell` moves into the shell.
  - New `widgets/app-shell` (Sidebar, Header, Shell layout).
  - New `features/switch-theme`.
  - New `shared/lib/theme`, holding the preference store and the pre-paint script logic.
  - New pages: `pages/review-runs`, `pages/settings`, `pages/not-found`.
  - `entities/review-run` gets a run summary list query.
  - `shared/api` gets `listRuns`, with a mock implementation.
  - `features/auth-by-github` turns `UserMenu` into a dropdown.
  - New shadcn primitives in `shared/ui`: dropdown-menu, sheet (dialog) and separator, from the existing `radix-ui` package.
- **HTML**: `index.html` gets a small inline script that sets `data-theme` before the bundle loads.
- **Docs**: `FRONTEND_ARCHITECTURE.md` gets sections on routes, the shell and theming.
- **Backend (later)**: a `GET /runs` endpoint matching `listRuns`. Not built here.

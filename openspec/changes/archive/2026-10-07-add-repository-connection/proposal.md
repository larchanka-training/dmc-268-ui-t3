# Proposal

## Why

A signed-in user can see review runs, but cannot see or choose which repositories the reviewer works on. The sprint's Definition of Done needs a user who signs in to see their repositories and a basic account area, and the bot can only review pull requests in repositories that are connected to it. The system design already defines a provider-agnostic `Repository` (provider, external ID, name, URL, default branch), so the UI can be built against that model now and switched from the mock adapter to the backend later.

## What Changes

- New **Repositories** page (`/repositories`): lists the repositories connected for the signed-in user, with provider, full name, visibility, default branch and connection time, plus loading, empty and error-with-Retry states. The empty state leads to the connect screen.
- New **Connect repository** screen (`/repositories/connect`): lists the repositories the user can access through the backend, with a name filter. Each one is either marked as already connected or has a "Connect" action. A successful connection returns the user to the list, which now includes it. When `VITE_GITHUB_APP_SLUG` is set, the screen links to the GitHub App installation page for repositories that are missing from the list.
- Repository data goes through the existing `ReviewApi` boundary (new `listRepositories`, `listAvailableRepositories`, `connectRepository` methods) and is validated with Zod. The mock adapter serves repository fixtures, so the screens work in mock mode with no backend.
- Account area ("cabinet"): "Repositories" becomes the first sidebar item, and `/` now redirects to `/repositories` instead of `/runs`, so a user lands on their repositories after sign-in. Legacy `/?run=<id>` links still redirect to the run.
- Sign-in stays GitHub-only in this change. The repository model and UI carry a `provider` field (`github` | `gitlab`) so GitLab repositories render once GitLab sign-in exists. **GitLab sign-in is deferred to a separate change**; this change therefore covers the DoD for GitHub only.

Out of scope: disconnecting a repository, per-repository settings or rules, filtering runs by repository, server-side pagination or search of accessible repositories, and the real HTTP `ReviewApi` adapter.

## Capabilities

### New Capabilities

- `repository-management`: viewing the repositories connected for the signed-in user and connecting new ones from the repositories they can access, including the repository data contract, states, and the GitHub App installation link.

### Modified Capabilities

- `app-shell`: the primary navigation gains "Repositories", the route list gains `/repositories` and `/repositories/connect`, and `/` redirects to `/repositories`.

## Impact

- **Code:** `shared/api` (`ReviewApi` methods, wire types, mock adapter and fixtures, `failuresFromSearch`), `shared/config/env.ts` (optional `VITE_GITHUB_APP_SLUG`), new `entities/repository`, `features/connect-repository`, `pages/repositories`, `pages/connect-repository`, `app/router.tsx` and `app/ui/routes.tsx`, `widgets/app-shell` (`NavList`).
- **Tests:** existing App and NavList tests that assume `/` → `/runs` or the current nav order need updating.
- **Docs:** `FRONTEND_ARCHITECTURE.md` (routes, data flow, proposed backend contract), `.env.example`, `docs/github-app-setup.md` (app slug and installation link).
- **Backend:** proposes `GET /repositories`, `GET /repositories/available`, `POST /repositories`. These are not an approved contract; the backend owner must confirm them before the HTTP adapter is written.
- **Dependencies:** none new.

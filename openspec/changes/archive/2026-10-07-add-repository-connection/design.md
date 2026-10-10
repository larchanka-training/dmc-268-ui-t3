# Design

## Context

- **Data boundary.** `shared/api/review-api.ts` defines `ReviewApi`. Every method resolves with `unknown`, and entity hooks parse it with Zod schemas that also map snake_case to camelCase. The app only has the mock adapter (`createMockReviewApi`), created per user inside `SessionGate`. Sign-out clears the whole TanStack Query cache (`App.tsx`), and `query-client.ts` never retries Zod errors or 4xx responses.
- **Mock state contract.** `shared/api/mock/app-state.mock.ts` is embedded in `FRONTEND_ARCHITECTURE.md`, and `app-state.mock.test.ts` fails if the two drift. The mock serves one run.
- **Routing and shell.** `app/router.tsx` has a code-based TanStack Router tree. The pathless `app` route runs `SessionGate`, and the index route redirects `/` to `/runs` (or `/?run=<id>` to `/runs/<id>`). `NavList` renders "Review runs" and "Settings", uses `activeOptions.exact` for `aria-current`, and gives "Review runs" a visual section highlight on nested routes.
- **Return path.** `safeReturnPath` falls back to `/` and the callback lands there, so the root redirect decides where a new session lands.
- **System design** (pinned revision a9277b9): `Repository` holds provider, external ID, name, URL and default branch, and belongs to a `Project`. GitHub/GitLab specifics stay behind adapters. No repository API is defined yet, and VCS permission scopes are an open decision.
- **Pages in place.** `ReviewRunsPage` sets the pattern for list pages: a `describe-error` helper that never shows response bodies, a `role="alert"` error with Retry, a `role="status"` loading line, and an empty message.

## Goals / Non-Goals

**Goals:**

- Repository screens that work fully in mock mode and need only a new adapter, not UI changes, once the backend exists.
- A provider-agnostic repository model, so GitLab needs no UI model change later.
- The same states, validation and per-user cache rules as the run list.

**Non-Goals:**

- Choosing or grouping by `Project`. The backend owns that mapping; the UI does not show projects in v1.
- Server-side pagination or search for accessible repositories.
- Optimistic updates for connecting.
- Changing the mock run state or its documented shape.

## Decisions

### 1. Extend `ReviewApi` rather than add a second API boundary

Add three methods:

- `listRepositories(signal)` — the connected repositories (`GET /repositories`).
- `listAvailableRepositories(signal)` — the repositories the user can access (`GET /repositories/available`).
- `connectRepository({ provider, externalId }, signal)` — connect one (`POST /repositories`); resolves with the created repository.

They are the same backend, with the same bearer auth and the same per-user lifetime. A separate `RepositoryApi` would mean a second provider, a second factory in router context, and a second test injection option for no isolation gain. `ReviewApiMethod` grows automatically, so `failuresFromSearch` and `setFailure` cover the new methods once they are added to its list.

_Alternative:_ a separate `RepositoryApi` context. Rejected for the wiring cost above. It can be split later behind the same hooks if the backend separates the services.

### 2. Proposed wire contract (not approved)

```ts
type VcsProviderWire = 'github' | 'gitlab'

interface RepositoryWire {
  repository_id: string
  provider: VcsProviderWire
  external_id: string // provider's ID as a string (GitHub numeric ID, GitLab project ID)
  full_name: string // owner/name or group/subgroup/name
  url: string // https web URL
  default_branch: string
  private: boolean
  connected_at: string // ISO datetime
}

interface AvailableRepositoryWire {
  provider: VcsProviderWire
  external_id: string
  full_name: string
  url: string
  default_branch: string
  private: boolean
  /** Set when this repository is already connected. */
  repository_id: string | null
}
```

`POST /repositories` takes `{ provider, external_id }` and returns `201 RepositoryWire`. `409` means it is already connected, and `403`/`404` mean the reviewer cannot access it. The fields follow the system design's `Repository`. `external_id` is a string because GitHub and GitLab IDs differ in kind and a JS number would be lossy for very large IDs. The contract goes into `FRONTEND_ARCHITECTURE.md` marked as a proposal for the backend owner.

### 3. `entities/repository` with Zod schemas and query hooks

- `repositorySchema` and `availableRepositorySchema` map to the view models `Repository` and `AvailableRepository` (with `isConnected = repository_id !== null`).
- `url` must parse as an absolute `https:` URL (`z.url({ protocol: /^https$/ })` or a refine). This keeps `javascript:` and other schemes out of `href`, and an invalid entry fails the whole list, as the specs require.
- `provider` is `z.enum(['github', 'gitlab'])`.
- Query keys are `['repositories', 'connected']` and `['repositories', 'available']`. Both start with `['repositories']`, so one `invalidateQueries({ queryKey: ['repositories'] })` refreshes both after a connection.
- `sortByFullName` uses `localeCompare` with `sensitivity: 'base'`.
- UI pieces in the entity are a `ProviderBadge` (a text badge "GitHub"/"GitLab"; the installed lucide version ships no brand icons, and no icon package is added for this) and a `VisibilityBadge` (Private/Public).

_Alternative:_ keys under `['user', userId, ...]`. Not needed, because the cache is cleared on sign-out and `SignedInLayout` is keyed by user ID.

### 4. `features/connect-repository`: mutation without optimistic update

`useConnectRepository()` wraps `useMutation`. On success, and on `ApiError` 409, it invalidates `['repositories']` and calls `onConnected()`, which the page uses to navigate to `/repositories`. Navigation waits for the invalidation, so the new entry is on screen when the list renders. Otherwise the list could flash the old cache. Other errors stay on the mutation and are shown inline.

There is one mutation instance per row (`ConnectRepositoryButton` owns its own `useMutation`), so errors and pending state are per repository and other rows stay usable. Double submission is prevented by `disabled={isPending}`, and mutations are not retried (TanStack default), so one click sends one request. No idempotency key is needed: connecting is naturally idempotent on `(provider, external_id)`, and the server reports duplicates as 409.

The error message comes from a `describeConnectError` helper. A 403 or 404 says the reviewer cannot access the repository, and any other error is generic. Response bodies are never shown.

_Alternative:_ an optimistic insert into the connected list. Rejected: the server assigns `repository_id` and `connected_at`, and a failed connection would need a rollback on a page the user has already left.

### 5. Pages and routes

- `pages/repositories` — `RepositoriesPage`. A header has the "Connect repository" link (hidden in the empty state, where the empty message carries the same link, so there is one CTA on screen). The list is `ul aria-label="Connected repositories"`. Each entry shows `ProviderBadge`, `full_name`, `VisibilityBadge`, a default-branch label, and `<time>` for `connected_at` in the same UTC format as the run list. An external link icon has `target="_blank" rel="noopener noreferrer"` and the accessible name "Open <full_name> on GitHub/GitLab".
- `pages/connect-repository` — `ConnectRepositoryPage` with props `{ githubAppInstallUrl: string | null; onConnected: () => void }`, so the page does not read config or the router. It has a back link, a labelled filter input (local `useState`, filtering in memory), the list with per-row `ConnectRepositoryButton` or a "Connected" badge, and the optional installation link.
- Router: add `/repositories` (title "Repositories") and `/repositories/connect` (title "Connect repository") under the `app` route. The index route's default redirect becomes `/repositories`, and the `?run=` branch is unchanged. `ConnectRepositoryRoute` in `app/ui/routes.tsx` gets the install URL from router context config and passes `onConnected = () => navigate({ to: '/repositories' })`.

_Alternative:_ a dialog on `/repositories` instead of a separate route. Rejected: the request asks for a "screen", a route can be deep-linked and reached with the back button, and it matches how runs work.

### 6. Navigation

`NavList` gets "Repositories" (lucide `FolderGit2Icon`) as the first item, using the existing `itemClassName` with `sectionActive` from `matchRoute({ to: '/repositories', fuzzy: true })`. With `activeOptions.exact`, `/repositories/connect` gives the visual section highlight and no `aria-current`, matching the open-run pattern.

### 7. Configuration: optional `VITE_GITHUB_APP_SLUG`

`parseEnv` accepts an optional `VITE_GITHUB_APP_SLUG` matching `^[a-z0-9]+(?:-[a-z0-9]+)*$` in every auth mode, and reports an invalid value as a config issue like the other variables. `AppConfig` gains `githubAppInstallUrl: string | null`, built as `https://github.com/apps/<slug>/installations/new`. The slug is public (it is in the app's public URL), so it is safe as `VITE_*`.

_Alternative:_ derive the install link from the backend. Possible later; a build-time value needs no API now.

### 8. Mock adapter fixtures

A new `shared/api/mock/repositories.mock.ts` exports the initial connected and available repositories: about 6 GitHub repositories with 2 connected, including one private and one with a non-`main` default branch, and one GitLab repository already connected so the GitLab label is exercised. `MockReviewApiOptions` gets an optional `repositories` override for tests. `connectRepository` moves the item into the connected list with `connected_at = now()`, returns 409 for a repository that is already connected and 404 for an unknown one. Keeping it outside `app-state.mock.ts` leaves the documented run state and its drift test alone.

## Risks / Trade-offs

- [The backend contract differs from the proposal] → Only `shared/api/types.ts`, the entity schemas, and the future HTTP adapter depend on field names. Pages use the view models. The proposal is documented for the backend owner.
- [A user with many accessible repositories gets a long, unpaginated list] → Filtering is in memory, and the list renders plain rows. If the backend paginates, `listAvailableRepositories` changes to an infinite query without affecting the specs' behavior. This is recorded as an open question.
- [Changing `/` to `/repositories` breaks bookmarks or tests that expect `/runs`] → Only the bare root changes. `/runs` and `/?run=<id>` still work, and the App tests are updated in the same change.
- [GitLab repositories appear before GitLab sign-in exists] → Rendering one is harmless. The connect screen lists whatever the backend says the user can access, and the mock includes one GitLab entry only on the connected list.
- [Users expect "Connect" to install the GitHub App] → The installation link explains the path for missing repositories. Without a slug, the empty state says no repositories were found.

## Migration Plan

Frontend only, behind the mock adapter. No data migration. Rollback is reverting the change. The `/` redirect returns to `/runs`.

## Open Questions

- Will `GET /repositories/available` be paginated or searchable on the server? (Backend owner. It changes the adapter and hook, not the screens.)
- Does connecting a repository require choosing a `Project`, or does the backend assign a default per user? (Backend owner. A project picker would be a follow-up change.)
- The exact GitHub App permissions for listing installation repositories. (Security/VCS scopes are an open decision in the system design.)

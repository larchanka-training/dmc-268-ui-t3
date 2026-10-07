# Tasks

## 1. Data boundary and mock

- [x] 1.1 Add `VcsProviderWire`, `RepositoryWire` and `AvailableRepositoryWire` to `shared/api/types.ts`, and add `listRepositories`, `listAvailableRepositories` and `connectRepository` (with a `ConnectRepositoryRequest { provider, externalId }` type exported from `shared/api`) to `ReviewApi`, each documented with its proposed endpoint. Verify that `pnpm check-types` reports only the expected errors in the mock adapter
- [x] 1.2 Add `shared/api/mock/repositories.mock.ts` with the connected and available fixtures from design decision 8. Implement the three methods in `createMockReviewApi` (with a `repositories` option override; `connectRepository` returns 409 for an already connected repository and 404 for an unknown one) and add them to `failuresFromSearch`. Verify with `mock-review-api.test.ts` cases for listing, connecting (the item appears in both lists as connected), 409, 404 and the failure switch, and check that `app-state.mock.test.ts` still passes unchanged

## 2. Configuration

- [x] 2.1 Add the optional `VITE_GITHUB_APP_SLUG` to `parseEnv` (slug pattern, reported as a config issue when invalid, accepted in every auth mode), and add `githubAppInstallUrl: string | null` to `AppConfig`. Verify with `env.test.ts` cases for an unset slug, a valid slug producing `https://github.com/apps/<slug>/installations/new`, and an invalid slug naming `VITE_GITHUB_APP_SLUG`
- [x] 2.2 Document `VITE_GITHUB_APP_SLUG` in `.env.example` and in `docs/github-app-setup.md` (where the slug is found, and that it is public). Verify that `pnpm format:check` passes

## 3. Repository entity

- [x] 3.1 Create `entities/repository` with `repositorySchema`, `availableRepositorySchema` and their list schemas (https-only `url`, provider enum, snake→camel, `isConnected`), `sortByFullName`, `repositoryKeys`, `useRepositories()` and `useAvailableRepositories()`, exported from `index.ts`. Verify with tests for parsing, rejecting `javascript:` URLs and unknown providers, case-insensitive sorting, and the AbortSignal being passed to the adapter
- [x] 3.2 Add `ProviderBadge` and `VisibilityBadge` built on `shared/ui/badge`. Verify with a component test that `github`/`gitlab` render "GitHub"/"GitLab" and that private/public render "Private"/"Public"

## 4. Connect feature

- [x] 4.1 Create `features/connect-repository` with `useConnectRepository({ onConnected })` (invalidates `['repositories']`, treats `ApiError` 409 as success, then calls `onConnected`), `describeConnectError` (403/404 → no access; otherwise generic; never response bodies), and `ConnectRepositoryButton` (its own mutation, disabled with a progress label while pending, inline `role="alert"` error). Verify with component tests through `renderWithProviders` and the mock failure switch: success calls `onConnected` after the connected list is refetched, a double click sends one request, 409 calls `onConnected`, 500 shows the error and re-enables the button, 403 shows the no-access message

## 5. Pages

- [x] 5.1 Add `pages/repositories` (`RepositoriesPage`): heading, "Connect repository" link (only when the list is non-empty), sorted list `Connected repositories` with provider, full name, visibility, default branch, UTC connection time and an external link (`target="_blank" rel="noopener noreferrer"`, accessible name naming the provider), plus loading, empty (with the "Connect repository" link) and error-with-Retry states using a `describe-error` helper. Verify with component tests through `renderWithRouter` covering each state, the sort order, the GitLab label, link `href`s and `rel`, and that Retry refetches
- [x] 5.2 Add `pages/connect-repository` (`ConnectRepositoryPage` with props `githubAppInstallUrl` and `onConnected`): back link to "Repositories", a labelled case-insensitive filter with a no-match message, a sorted list with `ConnectRepositoryButton` or a "Connected" badge per row, loading, empty and error-with-Retry states, and the installation link only when the URL is set. Verify with component tests covering each state, filtering (`DOC` matches `acme/docs`), the no-match message, connected rows having no button, and the install link being present or absent

## 6. Routes and navigation

- [x] 6.1 Register `/repositories` ("Repositories") and `/repositories/connect` ("Connect repository") in `app/router.tsx`. Add `ConnectRepositoryRoute` to `app/ui/routes.tsx` (install URL from config; `onConnected` navigates to `/repositories`). Change the index route's default redirect to `/repositories`, keeping `?run=`. Update `App.test.tsx`: `/` → `/repositories`, a signed-out `/` landing on `/repositories` after the callback, the two document titles, `/?run=<id>` still → `/runs/<id>`, no repository request while signed out, and an end-to-end connect (open `/repositories/connect`, connect a repository, land on `/repositories` with it listed). Verify that `pnpm test` passes
- [x] 6.2 Add "Repositories" as the first `NavList` item (`FolderGit2Icon`, section-active on `/repositories/connect`, exact `aria-current`). Update `Sidebar.test.tsx`/`AppShell.test.tsx` for the item order, `aria-current` on `/repositories`, the section highlight with no `aria-current` on `/repositories/connect`, and the rail tooltip. Verify that `pnpm test` passes

## 7. Documentation and integration

- [x] 7.1 Update `FRONTEND_ARCHITECTURE.md`: the route tree and its titles, the server-state table (`['repositories', 'connected']`, `['repositories', 'available']`), the app shell nav row, the `ReviewApi` methods, and a "Repository endpoints (proposed)" table with the wire shapes and status codes from design decision 2, marked as unapproved. Verify that the mock-state drift test still passes and `pnpm format:check` passes
- [x] 7.2 Run `pnpm lint`, `pnpm check-types`, `pnpm test` and `pnpm build`, all passing with zero warnings. Then, in mock mode with `pnpm dev`, sign in, check that you land on `/repositories`, connect a repository, check that it is listed, and try `?mockFail=connectRepository` and `?mockFail=listRepositories` for the error states, at both a wide and a narrow viewport and in both themes

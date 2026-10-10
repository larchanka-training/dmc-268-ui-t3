# Tasks

## 1. Public configuration

- [x] 1.1 Add `src/vite-env.d.ts` with typed `ImportMetaEnv` keys `VITE_AUTH_MODE`, `VITE_GITHUB_CLIENT_ID`, `VITE_GITHUB_REDIRECT_URI`, `VITE_API_BASE_URL`; verify `pnpm check-types` passes
- [x] 1.2 Implement `shared/config/env.ts`: a Zod parse that defaults the mode to `mock` and, in `github` mode only, requires a client ID and an absolute `http(s)` redirect URI ending in `/auth/callback`. It returns `{ ok, config | issues }`. Verify with `env.test.ts` covering mock defaults, a valid github config, and a missing or malformed client ID or redirect URI that names the variable
- [x] 1.3 Add a committed `.env.example` with the four variables, the mock defaults, and comments saying the client secret, private key, and webhook secret belong to the backend and must never use the `VITE_` prefix. Verify that `git check-ignore .env .env.local` lists both and that `.env.example` is not ignored

## 2. Shared auth transport

- [x] 2.1 Implement `shared/lib/pkce.ts` (random state of at least 128 bits, a verifier, an `S256` challenge through Web Crypto). Verify with `pkce.test.ts`: the RFC 7636 Appendix B vector produces the expected challenge, and two calls return different state values
- [x] 2.2 Define the `AuthApi` interface (`exchange`, `refresh`, `logout`, returning `unknown`), `AuthApiProvider`, and `useAuthApi` in `shared/api/auth/`, exported from `shared/api/index.ts`. Verify `pnpm lint` passes the FSD rules
- [x] 2.3 Implement `createHttpAuthApi(baseUrl)` with the design's endpoints, `credentials: 'include'`, and `ApiError` on non-2xx responses. Verify with tests on a stubbed `fetch`: method, path, body (snake_case), the credentials flag, and the status mapped to `ApiError`
- [x] 2.4 Implement `createMockAuthApi({ delayMs, user, tokenTtlSec, failures })`. It keeps a mock-only refresh marker in `sessionStorage`, returns `401` from refresh when the marker is absent, and clears the marker on logout. Verify with unit tests for exchange → refresh → logout → refresh `401`
- [x] 2.5 Implement `createAuthorizedFetch({ getToken, refresh, onUnauthorized })`. It adds the bearer token, makes one shared refresh and one retry on `401`, and calls `onUnauthorized` on a second `401`. Verify with tests: retry after a `401`, three concurrent `401`s causing exactly one refresh, and a second `401` signing out

## 3. Session entity

- [x] 3.1 Add `entities/session/model/schema.ts`, which parses `{ access_token, expires_in, user }` into a camelCase `Session` with `expiresAt` = receive time + `expires_in`. Verify with tests for valid input, a missing field (throws `ZodError`), and a negative `expires_in`
- [x] 3.2 Add the Zustand `sessionStore` (`restoring | signed-out | signed-in`, `reason`, in-memory token, user) plus `signIn`/`signOut` actions and selector hooks. Verify with store tests, including one checking that `localStorage`/`sessionStorage` hold no token after `signIn`
- [x] 3.3 Implement the single-flight `refreshSession(authApi)`: a `401` signs out with `reason: 'expired'`, and a network error or `5xx` rejects without signing out. Verify with tests that concurrent calls share one request, plus the two failure paths
- [x] 3.4 Implement `useSessionRefreshScheduler()`: a timer at `expiresAt - 60s`, an immediate refresh on `visibilitychange` once that time has passed, backoff retries (5s, 15s, 30s) while the token is valid, and cleanup on sign-out or unmount. Verify with fake-timer tests for proactive renewal, the past-due refresh on visibility, transient retry, and no timers after sign-out
- [x] 3.5 Expose the slice's public API through `entities/session/index.ts`. Verify `pnpm lint` passes

## 4. Sign-in feature

- [x] 4.1 Implement `startGithubSignIn(config, location)`. It stores `{ state, verifier, returnTo }` under one `sessionStorage` key, builds the GitHub authorize URL (`client_id`, `redirect_uri`, `state`, `code_challenge`, `code_challenge_method=S256`), or in mock mode a local `/auth/callback?code=mock-…&state=…`, then assigns `location`. Verify with tests on the URL parameters, a fresh state on each call, and the stored return path
- [x] 4.2 Implement `useCompleteSignIn()`. It reads `code`, `state`, and `error` once (ref-guarded for StrictMode), calls `replaceState` to strip the query before the exchange, deletes the stored state, checks `state`, calls `exchange`, parses the session, signs in, and navigates to a same-origin `returnTo` (otherwise `/`). It reports `cancelled`, `state-mismatch`, or `exchange-failed`. Verify with tests for each result, for no exchange being sent on mismatch or denial, for exactly one exchange under StrictMode, and for an external `returnTo` falling back to `/`
- [x] 4.3 Implement `SignInButton` and `UserMenu` (avatar, login, "Sign out" that calls logout, clears the session even when logout fails, and runs an `onSignedOut` callback). Verify with component tests through Testing Library
- [x] 4.4 Export the feature through `features/auth-by-github/index.ts`. Verify `pnpm lint` passes

## 5. Pages

- [x] 5.1 Add `pages/sign-in`: the sign-in button, a "session expired" message when `reason === 'expired'`, and a configuration-error state that lists the invalid env variables. Verify with component tests for all three states
- [x] 5.2 Add `pages/auth-callback`: a "Signing you in…" loading state and error states for cancelled, mismatch, and failure, each with "Try again". Verify with component tests using the mock `AuthApi`

## 6. App wiring

- [x] 6.1 Add `app/routing.ts` with `resolveRoute(location)` (`/auth/callback` goes to callback, anything else goes to main). Verify with unit tests
- [x] 6.2 Choose the `AuthApi` adapter from the parsed env in `App.tsx`, add `AuthApiProvider` to `AppProviders`, and extend `renderWithProviders` with an `authApi` option. Verify that existing tests still pass with `pnpm test`
- [x] 6.3 Add a session gate. On load it runs one restore through `refreshSession`, shows a loading state while `restoring`, then the sign-in page or the signed-in shell (`UserMenu` + `ReviewRunPage`), and runs the refresh scheduler while signed in. Verify with an `App` test: no stored session shows sign-in and makes no review request, and a stored mock session restores and shows the run
- [x] 6.4 Create the mock `ReviewApi` inside the signed-in shell with `author: user.login`, keyed by user ID, and call `queryClient.clear()` on sign-out. Verify with a test where a reply posted as `octocat` shows author `octocat`, and the review cache is empty after sign-out

## 7. Documentation and dev setup

- [x] 7.1 Write `docs/github-app-setup.md`. It covers creating the GitHub App: the homepage URL, callback URLs (localhost and production), "Expire user authorization tokens" on, OAuth-during-install off, webhook inactive for now, no extra permissions, where to copy the Client ID (into `.env.local`), and that the client secret and private key go to the backend only. Verify that each setting named in the doc matches the variables in `.env.example`
- [x] 7.2 Add an "Authentication" section to `FRONTEND_ARCHITECTURE.md` with the flow diagram, the new slices in the layer table, the session state row, and the backend contract table from `design.md`. Link it from `README.md` (in Russian) along with the `cp .env.example .env.local` step. Verify `pnpm format:check` passes
- [x] 7.3 Add a Vite `server.proxy` for `/api` driven by an optional non-public `API_PROXY_TARGET`, used only when it is set, for running against a local backend in `github` mode. Document it in `.env.example`. Verify that `pnpm dev` still starts in mock mode with the variable unset

## 8. Integration checks

- [x] 8.1 Run `pnpm check-types && pnpm lint && pnpm test && pnpm format:check && pnpm build` and verify that all pass
- [x] 8.2 Manual mock-mode check in the browser with `pnpm dev`: sign in, land back on `/?run=…` with a clean URL, see the token refresh happen silently within the 2-minute mock TTL (Network tab), reload and stay signed in, sign out and return to the sign-in screen, and confirm that `localStorage`/`sessionStorage` hold no access token
- [x] 8.3 Check the production build: `pnpm preview` serves `/auth/callback` through the SPA fallback (the nginx `try_files` rule already covers it). Verify that opening `/auth/callback?state=bad&code=x` shows the mismatch error

## Workflow follow-up

- After the GitHub App is registered and the backend implements the contract, rebuild with `VITE_AUTH_MODE=github` and run 8.2 against the real GitHub App. Wire the Dockerfile `ARG`s and the CI `vars` for production.
- Archive the change after review.

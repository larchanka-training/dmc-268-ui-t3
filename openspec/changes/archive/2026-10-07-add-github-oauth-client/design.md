# Design

## Context

- This repo is the SPA only: Vite + React 18 + TanStack Query + Zustand + Zod, built to static files and served by nginx, with an SPA fallback for unknown paths. The backend (`dmc-268-api-t3`, FastAPI) owns tokens and secrets. The system design calls for JWT auth issued by the backend.
- `App.tsx` builds a mock `ReviewApi` once, with `author: 'you'`, and renders `ReviewRunPage` directly. There is no router, and `?run=` picks the run.
- FSD layers are enforced by `eslint.config.js`. `shared` has no slices, and every other layer is imported through a slice's `index.ts`.
- GitHub constraints:
  - `https://github.com/login/oauth/access_token` needs the client secret and does not send CORS headers, so the code exchange has to happen server-side.
  - GitHub App user tokens expire after 8 hours and come with 6-month refresh tokens when "Expire user authorization tokens" is on.
  - GitHub supports PKCE (`S256`) on the authorize endpoint.
- The GitHub App is not registered yet, and the backend endpoints do not exist.

## Goals / Non-Goals

**Goals:**

- A complete, tested client flow that runs end to end in `mock` mode today and switches to the real app by setting env vars.
- A written backend contract that the API team can implement without further back-and-forth.
- An auth-aware fetch helper that the future HTTP `ReviewApi` can use, so the "refresh on 401" behavior has a home now.

**Non-Goals:**

- Cross-tab session sync, for example logging out in one tab signing out the others. Each tab restores and refreshes on its own, which the backend's rotating refresh cookie allows (see Risks).
- Route-level code splitting and a router library.
- Fine-grained authorization, such as which repos or runs a user may see. That is a backend concern.

## Decisions

### 1. GitHub App user authorization flow, exchanged by the backend, with a backend-issued app session

The SPA redirects to GitHub and receives the `code`. The backend exchanges it with the client secret, stores the GitHub user tokens server-side, and returns **its own** short-lived access JWT plus the user profile. It also sets a rotating refresh token as an httpOnly, `Secure`, `SameSite=Lax` cookie with `Path=/auth`.

- Alternative: keep the GitHub tokens in the browser and have the backend only proxy the exchange. Rejected: an XSS bug would leak tokens that can act on GitHub for 8 hours, or 6 months for the refresh token. Every backend call would also need to check the token with GitHub.
- Alternative: an OAuth App. Rejected: its tokens never expire, so "auto-refresh" would mean nothing. The same GitHub App will later provide the bot identity and webhooks.
- PKCE is added on top of `state` even though a confidential client is doing the exchange. It costs little, and it ties the code to this tab.

### 2. Backend contract (hand-off; mocked here)

All endpoints sit under `VITE_API_BASE_URL`, use JSON, and send credentials (`credentials: 'include'`).

| Method & path                | Request                                 | Success                                                   | Errors                                               |
| ---------------------------- | --------------------------------------- | --------------------------------------------------------- | ---------------------------------------------------- |
| `POST /auth/github/exchange` | `{ code, code_verifier, redirect_uri }` | `200 { access_token, expires_in, user }` + Set-Cookie     | `400` invalid/expired code, `502` GitHub unavailable |
| `POST /auth/refresh`         | — (cookie)                              | `200 { access_token, expires_in, user }` + rotated cookie | `401` no/invalid/revoked refresh cookie              |
| `POST /auth/logout`          | — (cookie, `Authorization`)             | `204` + cookie cleared                                    | always clears                                        |

`user = { id: number, login: string, name: string | null, avatar_url: string }`, in snake_case on the wire. It is parsed by a Zod schema in `entities/session` that maps it to camelCase, following the existing boundary rule. `expires_in` is in seconds. The backend authenticates other API calls with `Authorization: Bearer <access_token>`.

The API base URL must be same-site with the SPA (production is served behind the same Caddy), so `SameSite=Lax` cookies work. In local dev, mock mode needs no backend. Real-backend dev uses a Vite `server.proxy` for `/auth` (task 7.3).

### 3. Module placement (FSD)

- `shared/config/env.ts`: a Zod-parsed `import.meta.env` that returns either `{ ok: true, config }` or `{ ok: false, issues }`. `src/vite-env.d.ts` types the `VITE_*` keys.
- `shared/lib/pkce.ts`: random `state`, a verifier, and an `S256` challenge through `crypto.getRandomValues` and `crypto.subtle.digest`. No new dependency.
- `shared/api/auth/`:
  - an `AuthApi` interface (`exchange`, `refresh`, `logout`), whose methods return `unknown` like `ReviewApi`;
  - `createHttpAuthApi(baseUrl)`;
  - `createMockAuthApi()`. The mock keeps its "refresh cookie" in `sessionStorage` under a mock-only key, so reload-restore can be exercised. This is a stand-in for the httpOnly cookie and holds no real credential. The mock access token lasts 2 minutes, so refresh can be observed in dev.
  - `createAuthorizedFetch({ getToken, refresh, onUnauthorized })`, which adds the bearer token, retries once on `401` after a shared refresh, and calls `onUnauthorized` on a second `401`;
  - an `AuthApiProvider`/`useAuthApi` context, mirroring `ReviewApiProvider`.
- `entities/session`: the `sessionSchema`, a Zustand `sessionStore` (`status: 'restoring' | 'signed-out' | 'signed-in'`, the in-memory `accessToken`, `expiresAt`, `user`, and a `reason` for sign-out messages), and a `refreshSession()` single-flight wrapper. The `useSessionRefreshScheduler()` hook arms a timer for `expiresAt - 60s`, re-checks on `visibilitychange`, and on transient failure retries with backoff (5s, 15s, 30s) while the token is still valid. A `401` from refresh means signed-out with `reason: 'expired'`.
- `features/auth-by-github`: `startGithubSignIn()` creates and stores `state`, the verifier, and the return path in `sessionStorage` under one key, then builds the authorize URL. In mock mode it points at `/auth/callback?code=mock-…&state=…`. The slice also holds the `useCompleteSignIn()` callback logic, `SignInButton`, and `UserMenu`, which shows the avatar, login, and sign-out.
- `pages/sign-in`, `pages/auth-callback`: thin pages for the loading, error, and "Try again" states.
- `app`: a tiny `resolveRoute(location)`. `/auth/callback` goes to the callback page, and anything else goes through the session gate, which shows restoring, then sign-in or the review page. The `AuthApi` adapter is picked from `VITE_AUTH_MODE`. The `ReviewApi` mock is created **inside** the signed-in subtree with `author: user.login` and is keyed by user ID, so replies are attributed to the session user. On sign-out the app calls `queryClient.clear()`.

### 4. Callback hygiene

The callback page calls `history.replaceState` to `/auth/callback` (no query) **synchronously before** it starts the exchange. It keeps the parsed `code` and `state` in a ref, which guards against StrictMode's double effect run. The stored state is deleted as soon as it is read, so a reload cannot reuse it. When the exchange succeeds, `replaceState` goes to the saved return path, which must be a same-origin path. Anything else falls back to `/`.

### 5. Configuration

`.env.example` (committed) lists the variables below. Developers copy it to `.env.local`, which is gitignored. `.env` is also gitignored already.

```
VITE_AUTH_MODE=mock                 # mock | github
VITE_GITHUB_CLIENT_ID=              # GitHub App "Client ID" (Iv23…); public
VITE_GITHUB_REDIRECT_URI=http://localhost:5173/auth/callback
VITE_API_BASE_URL=/api              # backend base, same-site
```

The comments in `.env.example` say plainly that the client secret, private key, and webhook secret belong to the backend `.env` and must never get a `VITE_` prefix. `docs/github-app-setup.md` describes how to register the app: the callback URLs for localhost and production, "Expire user authorization tokens" turned on, "Request user authorization (OAuth) during installation" left off, webhooks left inactive for now, and no extra permissions, because sign-in only needs identity.

## Risks / Trade-offs

- [A rotating refresh cookie plus several tabs can race: tab A rotates and tab B sends the old cookie] → The backend contract asks for a short reuse grace window for the previous refresh token. The client signs out cleanly on `401`, so the worst case is one extra sign-in. Cross-tab sync is a non-goal.
- [`VITE_*` values are baked in at build time; the Docker image is built in CI without a `.env`] → The default `mock` keeps the current production behavior, so nothing breaks. Switching production to `github` needs Docker `ARG`s and CI variables. That is deferred until the app and backend exist (see Open Questions).
- [The mock "refresh cookie" in `sessionStorage` could be copied into the real adapter by mistake] → It lives only in `mock-auth-api.ts`, and a unit test checks that the HTTP adapter and the session store never touch web storage for tokens.
- [An in-memory token is lost on reload] → This is intended. Restoring through the cookie costs one request, and a loading state covers it.
- [Clock skew between the client and the backend] → Expiry is calculated from the client's receive time plus `expires_in`, not from an absolute `exp`.

## Migration Plan

1. Merge with `VITE_AUTH_MODE` defaulting to `mock`. Production then shows the sign-in screen, and sign-in completes with a mock user. This matches today's mock-only review data.
2. Register the GitHub App following `docs/github-app-setup.md`. The backend implements the contract above.
3. Set `VITE_AUTH_MODE=github` plus the client ID and redirect URI for the build. Rollback: rebuild with `mock`.

## Open Questions

- Wiring production build arguments (Dockerfile `ARG` + CI `vars`) for the `VITE_*` values. This can be done once the GitHub App exists, and it does not change this design.
- The backend team may rename the `/auth/*` paths. Only `createHttpAuthApi` would change.

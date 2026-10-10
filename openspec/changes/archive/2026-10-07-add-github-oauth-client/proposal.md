# Proposal

## Why

The review UI opens for anyone and has no idea who the user is. Replies are signed with a hard-coded `you`. The bot will post to GitHub repositories, so users have to sign in with their GitHub identity before the UI can act for them, and the session has to stay valid during a long review without asking them to log in again. The GitHub App does not exist yet. The client flow therefore has to be built and testable against a mock backend now, and switch to the real app later through configuration only.

## What Changes

- Add a GitHub sign-in flow to the SPA. The SPA builds the GitHub App authorize URL with `state` and PKCE (`S256`), redirects the browser there, captures the callback at `/auth/callback`, checks `state`, and hands `code` + `code_verifier` to the backend for exchange. The client secret never reaches the browser.
- Add an app session model. The backend returns a short-lived access token and the user profile, and keeps the refresh token in an httpOnly cookie. The SPA keeps the access token in memory only and never writes it to `localStorage`.
- Refresh automatically. The SPA renews the access token silently before it expires, restores the session on page load through the refresh cookie, and retries a request once after a `401`. Concurrent refreshes share a single request. A failed refresh signs the user out.
- Gate the app. Signed-out users see a sign-in screen. Signed-in users see the review page with their GitHub login and a sign-out action. The reply author comes from the session user instead of `you`.
- Add an `AuthApi` transport boundary with a mock adapter, the default until the backend exists, and an HTTP adapter for the backend auth endpoints. The backend contract is written down for hand-off.
- Add `.env.example`, a typed and Zod-validated `import.meta.env` config, and a setup guide for registering the GitHub App (callback URL, expiring user tokens). Only public values (`VITE_*`) live in this repo. Secrets stay with the backend.

Out of scope: the bot's comment read/write, PR webhooks, the backend exchange/refresh implementation (`dmc-268-api-t3`), GitHub App installation and permissions for the bot, and a real HTTP `ReviewApi`.

## Capabilities

### New Capabilities

- `github-auth-client`: browser-side GitHub sign-in and session handling. Covers the authorize redirect with state/PKCE, callback capture, session storage, silent and on-401 refresh, sign-out, the signed-out/signed-in gating, and the public env configuration.

### Modified Capabilities

<!-- none: frontend-architecture's layering, validation, and state rules apply unchanged to the new slices -->

## Impact

- **Code**: new `shared/config/env.ts`, `shared/api/auth/` (AuthApi, mock and HTTP adapters, authorized fetch), `entities/session` (store, schema, refresh scheduler), `features/auth-by-github` (sign-in button, callback handling, sign-out), `pages/sign-in`, `pages/auth-callback`. Changes to `app/App.tsx` and `app/providers`. The reply author comes from the session.
- **Config**: new `.env.example` and `src/vite-env.d.ts` env typings. `.env` is already gitignored.
- **Docs**: `docs/github-app-setup.md`, plus an auth section in `FRONTEND_ARCHITECTURE.md` with the backend contract.
- **Dependencies**: none new. Routing is a small path switch, with no router library.
- **Backend (hand-off, not built here)**: `POST /auth/github/exchange`, `POST /auth/refresh`, `POST /auth/logout`, and a refresh cookie scoped to `/auth`.

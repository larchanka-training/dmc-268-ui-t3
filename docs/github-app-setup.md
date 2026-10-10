# GitHub App setup

The review UI signs users in with a **GitHub App** using the user authorization flow. A GitHub App is used instead of an OAuth App because its user tokens expire and can be refreshed, and because the same app will later act as the review bot and receive pull request webhooks. Until the app exists, the UI runs with `VITE_AUTH_MODE=mock` and needs none of this.

This guide covers only what sign-in needs. The bot's permissions, installation and webhooks are configured later, together with the backend work that uses them.

## 1. Register the app

Go to GitHub → **Settings** → **Developer settings** → **GitHub Apps** → **New GitHub App**. To create it under the team's organization instead, use the organization's **Settings** → **Developer settings**.

| Field                                                  | Value                                                                                                                                         |
| ------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------- |
| GitHub App name                                        | Any unique name, for example `dmc-268-review-t3`                                                                                              |
| Homepage URL                                           | The production address of the UI                                                                                                              |
| Callback URL                                           | `http://localhost:5173/auth/callback`. Add a second one with **Add Callback URL**: `https://<production host>/auth/callback`                   |
| Expire user authorization tokens                       | **On.** The backend then receives a refresh token, which is what keeps sessions alive                                                         |
| Request user authorization (OAuth) during installation | Off                                                                                                                                           |
| Enable Device Flow                                     | Off                                                                                                                                           |
| Setup URL                                              | Empty                                                                                                                                         |
| Webhook → Active                                       | **Off** for now. The PR webhook URL and secret are set up together with the backend receiver                                                  |
| Permissions                                            | None. Sign-in only needs the user's identity, which every GitHub App gets                                                                     |
| Where can this GitHub App be installed?                | Only on this account                                                                                                                          |

Every callback URL must match `VITE_GITHUB_REDIRECT_URI` exactly for the build that uses it, including scheme, host and port. The path is always `/auth/callback`, which is the SPA route that finishes sign-in.

## 2. Copy the values

On the app's **General** page:

- **Client ID** (starts with `Iv`) is public. Put it in the UI's `.env.local` as `VITE_GITHUB_CLIENT_ID`.
- **Public link** (`https://github.com/apps/<slug>`): the last part is the app **slug**. It is public. Put it in `.env.local` as `VITE_GITHUB_APP_SLUG` (optional). The "Connect repository" screen then links to `https://github.com/apps/<slug>/installations/new`, where users install the app on more repositories.
- **Client secrets** → **Generate a new client secret** creates a confidential value. Give it to the backend only (its `.env`). The backend uses it to exchange the authorization code and to refresh tokens.
- **Private keys** → **Generate a private key** is needed later, for the bot (installation tokens). It is backend-only too.

Never put the client secret, the private key, or a webhook secret in this repository, and never give them a `VITE_` prefix. Vite compiles every `VITE_*` value into the public JS bundle.

## 3. Configure the UI

```bash
cp .env.example .env.local
```

```dotenv
VITE_AUTH_MODE=github
VITE_GITHUB_CLIENT_ID=Iv23li...
VITE_GITHUB_REDIRECT_URI=http://localhost:5173/auth/callback
VITE_API_BASE_URL=/api
VITE_GITHUB_APP_SLUG=dmc-268-review-t3
# Local backend for `pnpm dev`; Vite proxies /api to it.
API_PROXY_TARGET=http://localhost:8000
```

`github` mode needs the backend auth endpoints described in [FRONTEND_ARCHITECTURE.md](../FRONTEND_ARCHITECTURE.md#authentication). If a variable is missing or malformed, the app shows a configuration error that names it.

## How sign-in works

1. The UI redirects to `https://github.com/login/oauth/authorize` with the client ID, the callback URL, a random `state`, and a PKCE `S256` code challenge.
2. GitHub redirects back to `/auth/callback?code=…&state=…`. The UI checks `state` and sends `code` and the PKCE verifier to `POST /api/auth/github/exchange`.
3. The backend exchanges the code with the client secret and keeps the GitHub tokens. It returns a short-lived app access token, which the UI holds in memory only, and sets an httpOnly refresh cookie.
4. The UI renews the access token through `POST /api/auth/refresh` before it expires, and when the page is reloaded.

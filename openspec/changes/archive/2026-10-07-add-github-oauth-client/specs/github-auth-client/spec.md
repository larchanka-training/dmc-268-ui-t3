# Spec Delta

## Purpose

Lets a user sign in to the review UI with their GitHub account through the GitHub App user authorization flow and keeps their app session valid without asking them to sign in again, while no OAuth secret or long-lived credential is exposed to the browser.

## ADDED Requirements

### Requirement: Sign-in redirect

When the user starts sign-in, the system SHALL redirect the browser to the GitHub authorize endpoint with the configured client ID, the callback URL, a fresh unguessable `state`, and a PKCE `S256` code challenge. The `state` and code verifier MUST be kept only for this browser tab and MUST NOT leave it except as the protocol requires.

#### Scenario: Authorize URL parameters

- **WHEN** a signed-out user activates "Sign in with GitHub"
- **THEN** the browser navigates to `https://github.com/login/oauth/authorize` with `client_id`, `redirect_uri` equal to the configured callback URL, a `state` of at least 128 bits of randomness, `code_challenge`, and `code_challenge_method=S256`

#### Scenario: Each attempt uses a new state

- **WHEN** the user starts sign-in twice
- **THEN** the two redirects carry different `state` and `code_challenge` values

#### Scenario: Return path is preserved

- **WHEN** a signed-out user opens `/?run=abc` and signs in successfully
- **THEN** after the callback the user lands on `/?run=abc`

### Requirement: Callback handling

The system SHALL handle the `/auth/callback` route. It MUST accept the `code` only when the `state` in the URL matches the stored one, exchange the `code` and code verifier through the backend, and remove `code` and `state` from the address bar and browser history entry before it shows any other screen.

#### Scenario: Successful callback

- **WHEN** the browser returns to `/auth/callback?code=X&state=S` and `S` matches the stored state
- **THEN** the system sends `X`, the code verifier, and the callback URL to the backend exchange endpoint, starts the session from the response, clears the stored state and verifier, and navigates to the saved return path

#### Scenario: State mismatch

- **WHEN** the callback `state` is missing or does not match the stored state
- **THEN** no exchange request is sent and the user sees a sign-in error with a "Try again" action

#### Scenario: User denied access

- **WHEN** GitHub redirects back with `error=access_denied`
- **THEN** no exchange request is sent and the user sees that sign-in was cancelled, with a "Try again" action

#### Scenario: Exchange fails

- **WHEN** the backend exchange request fails or returns a payload that does not match the session schema
- **THEN** the user stays signed out and sees a sign-in error with a "Try again" action

#### Scenario: Callback is not replayed

- **WHEN** the exchange has completed and the user reloads or navigates back
- **THEN** the address no longer contains `code` or `state` and no second exchange is sent

### Requirement: Session storage

The app access token SHALL be held in memory only. It MUST NOT be written to `localStorage`, `sessionStorage`, cookies set by the SPA, or the URL. The refresh credential MUST be held by the backend as an httpOnly cookie that the SPA cannot read.

#### Scenario: Token not persisted by the SPA

- **WHEN** a user is signed in
- **THEN** neither `localStorage` nor `sessionStorage` contains the access token

#### Scenario: Session restored on reload

- **WHEN** a signed-in user reloads the page and the refresh cookie is still valid
- **THEN** the system obtains a new access token through the refresh endpoint and shows the signed-in app without redirecting to GitHub

#### Scenario: No session on first load

- **WHEN** the page loads and the refresh endpoint reports no valid session
- **THEN** the user sees the sign-in screen

### Requirement: Automatic refresh before expiry

While signed in, the system SHALL renew the access token before it expires without user interaction. Renewal MUST start no later than 60 seconds before the expiry the backend reported.

#### Scenario: Proactive renewal

- **WHEN** the access token expires in 15 minutes
- **THEN** a refresh request is sent at or before 14 minutes and the new token replaces the old one without any visible change

#### Scenario: Renewal after the tab was asleep

- **WHEN** the tab becomes visible again after the scheduled refresh time has passed
- **THEN** the system refreshes immediately instead of using the expired token

### Requirement: Refresh on unauthorized response

When an authenticated backend request returns `401`, the system SHALL refresh the session once and retry that request once with the new token. Concurrent callers MUST share a single in-flight refresh request.

#### Scenario: Retry after 401

- **WHEN** a request returns `401` and the refresh succeeds
- **THEN** the request is sent again with the new token and its result is returned to the caller

#### Scenario: Concurrent 401s

- **WHEN** three requests return `401` at the same time
- **THEN** exactly one refresh request is sent and all three requests are retried after it completes

#### Scenario: Second 401

- **WHEN** the retried request returns `401` again
- **THEN** the system does not refresh a second time and signs the user out

### Requirement: Session end

The system SHALL sign the user out when they choose to, or when a refresh is rejected. Signing out MUST clear the in-memory session, cancel scheduled refreshes, and drop cached server data that belongs to the user.

#### Scenario: User signs out

- **WHEN** the user activates "Sign out"
- **THEN** the system calls the backend logout endpoint, clears the session even if that call fails, and shows the sign-in screen

#### Scenario: Refresh rejected

- **WHEN** the refresh endpoint responds `401`
- **THEN** the user is shown the sign-in screen with a message that the session expired

#### Scenario: Transient refresh failure

- **WHEN** a scheduled refresh fails with a network error or `5xx` while the current token is still valid
- **THEN** the user stays signed in and the system retries the refresh before the token expires

### Requirement: Access gating and identity display

The review UI SHALL be shown only to signed-in users. While the session is being restored, the system MUST show a loading state instead of the sign-in screen or the review UI. Signed-in users MUST see their GitHub login and avatar and a sign-out action. Replies they write MUST be attributed to their GitHub login.

#### Scenario: Signed-out access

- **WHEN** a signed-out user opens `/?run=abc`
- **THEN** the sign-in screen is shown and no review data is requested

#### Scenario: Restoring session

- **WHEN** the page has just loaded and the restore request is in flight
- **THEN** a loading indicator is shown and neither the sign-in screen nor review data appears

#### Scenario: Reply attribution

- **WHEN** a user signed in as `octocat` posts a reply in mock mode
- **THEN** the reply's author is `octocat`

### Requirement: Public configuration

The GitHub client ID, callback URL, backend auth base URL, and auth mode SHALL be read from build-time public environment variables, validated at startup. The repository MUST include an example env file listing them, and MUST NOT contain or require a client secret, private key, or webhook secret.

#### Scenario: Invalid configuration in GitHub mode

- **WHEN** auth mode is `github` and the client ID or callback URL is missing or malformed
- **THEN** the app shows a configuration error naming the invalid variables instead of a broken sign-in button

#### Scenario: Mock mode needs no GitHub App

- **WHEN** auth mode is `mock` or unset
- **THEN** sign-in completes against the mock backend without contacting github.com, still going through the callback route with state validation

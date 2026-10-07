# Spec Delta

## MODIFIED Requirements

### Requirement: Sign-in redirect

When the user starts sign-in, the system SHALL redirect the browser to the GitHub authorize endpoint with the configured client ID, the callback URL, a fresh unguessable `state`, and a PKCE `S256` code challenge. The `state` and code verifier MUST be kept only for this browser tab and MUST NOT leave it except as the protocol requires.

#### Scenario: Authorize URL parameters

- **WHEN** a signed-out user activates "Sign in with GitHub"
- **THEN** the browser navigates to `https://github.com/login/oauth/authorize` with `client_id`, `redirect_uri` equal to the configured callback URL, a `state` of at least 128 bits of randomness, `code_challenge`, and `code_challenge_method=S256`

#### Scenario: Each attempt uses a new state

- **WHEN** the user starts sign-in twice
- **THEN** the two redirects carry different `state` and `code_challenge` values

#### Scenario: Return path is preserved

- **WHEN** a signed-out user opens `/runs/abc` and signs in successfully
- **THEN** after the callback the user lands on `/runs/abc`

#### Scenario: Legacy link return path

- **WHEN** a signed-out user opens `/?run=abc` and signs in successfully
- **THEN** after the callback the user lands on `/runs/abc`

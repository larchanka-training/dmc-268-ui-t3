# Spec Delta

## Purpose

Lets a signed-in user see which repositories are connected to the AI code reviewer and connect more of the repositories they can access, so the bot can review pull requests in them.

## ADDED Requirements

### Requirement: Connected repositories list

The `/repositories` page SHALL list the repositories connected for the signed-in user, sorted by full name. Each entry MUST show the provider, the full name (`owner/name`), whether the repository is private, the default branch, and when it was connected.

#### Scenario: Repositories listed

- **WHEN** the backend returns two connected repositories `acme/web` and `acme/api`
- **THEN** the page shows two entries in the order `acme/api`, `acme/web`, each with its provider, visibility, default branch and connection time

#### Scenario: GitLab repository

- **WHEN** a connected repository has provider `gitlab`
- **THEN** its entry is labelled as a GitLab repository, and GitHub repositories are labelled as GitHub

#### Scenario: Link to the provider

- **WHEN** the user activates the external link of an entry
- **THEN** the repository's provider page opens in a new tab, and the link does not give that page access to the opener

### Requirement: Repositories list states

The `/repositories` page MUST show distinct loading, empty, and error states. The empty state MUST say that no repositories are connected and offer a "Connect repository" link. The error state MUST offer a "Retry" action and show no partial list.

#### Scenario: Loading

- **WHEN** the list request is in flight
- **THEN** a loading status is announced and no entries are shown

#### Scenario: Nothing connected

- **WHEN** the backend returns no connected repositories
- **THEN** the page says no repositories are connected yet and shows a "Connect repository" link to `/repositories/connect`

#### Scenario: Load failure

- **WHEN** the list request fails or its payload fails validation
- **THEN** the page shows an error alert with a "Retry" action, and activating "Retry" requests the list again

### Requirement: Entry point to connecting

When at least one repository is connected, the `/repositories` page SHALL also show a "Connect repository" link to `/repositories/connect`.

#### Scenario: Connect link with a non-empty list

- **WHEN** the user has one connected repository
- **THEN** the page shows the entry and a "Connect repository" link to `/repositories/connect`

### Requirement: Accessible repositories for connection

The `/repositories/connect` page SHALL list the repositories the signed-in user can access through the reviewer, sorted by full name, with provider, full name, and visibility. A repository that is already connected MUST be marked "Connected" and MUST NOT offer a connect action; every other repository MUST offer a "Connect" action.

#### Scenario: Mixed list

- **WHEN** the user can access `acme/web` (already connected) and `acme/docs` (not connected)
- **THEN** `acme/docs` has a "Connect" button and `acme/web` is marked "Connected" without a button

#### Scenario: Back to the list

- **WHEN** the user is on `/repositories/connect`
- **THEN** a link back to "Repositories" (`/repositories`) is shown

### Requirement: Filter accessible repositories

The connect page SHALL provide a labelled text filter that narrows the list, case-insensitively, to repositories whose full name contains the entered text. When nothing matches, the page MUST say so.

#### Scenario: Filter narrows the list

- **WHEN** the user types `DOC` into the filter
- **THEN** only repositories whose full name contains `doc` in any case are shown

#### Scenario: No match

- **WHEN** the filter matches no repository
- **THEN** the page says no repositories match the filter and the full list returns when the filter is cleared

### Requirement: Connect page states

The connect page MUST show distinct loading, empty, and error states for the accessible repositories. The empty state MUST say that no accessible repositories were found. The error state MUST offer a "Retry" action and show no partial list.

#### Scenario: No accessible repositories

- **WHEN** the backend returns no accessible repositories
- **THEN** the page says no repositories were found that the reviewer can access

#### Scenario: Load failure

- **WHEN** the accessible repositories request fails or its payload fails validation
- **THEN** the page shows an error alert with a "Retry" action and no list

### Requirement: Connect a repository

Activating "Connect" SHALL ask the backend to connect that repository, identified by provider and provider ID. While the request is pending its button MUST be disabled and show progress. On success the user MUST be taken to `/repositories`, where the newly connected repository is listed.

#### Scenario: Successful connection

- **WHEN** the user activates "Connect" for `acme/docs` and the backend accepts it
- **THEN** the user is on `/repositories` and `acme/docs` appears in the list

#### Scenario: No double submission

- **WHEN** the user activates "Connect" twice before the first request finishes
- **THEN** exactly one connect request is sent

#### Scenario: Already connected elsewhere

- **WHEN** the backend responds that the repository is already connected (`409`)
- **THEN** the user is taken to `/repositories` as on success, and the repository is listed

### Requirement: Connection failure

When connecting fails for any reason other than "already connected", the system SHALL stay on the connect page, show an error message for that repository, keep its "Connect" action available for another attempt, and leave the other repositories usable.

#### Scenario: Server error

- **WHEN** the connect request for `acme/docs` fails with `500`
- **THEN** an error message is shown for `acme/docs`, its "Connect" button is enabled again, and the URL is still `/repositories/connect`

#### Scenario: Access lost

- **WHEN** the connect request fails with `403` or `404`
- **THEN** the error message says the reviewer cannot access the repository

### Requirement: GitHub App installation link

When the public GitHub App slug is configured, the connect page SHALL show a link to install the GitHub App on more repositories, pointing to `https://github.com/apps/<slug>/installations/new`. When the slug is not configured, no such link is shown. An invalid slug MUST be reported as a configuration error naming the variable.

#### Scenario: Slug configured

- **WHEN** the app slug is `dmc-268-review-t3`
- **THEN** the connect page links to `https://github.com/apps/dmc-268-review-t3/installations/new`

#### Scenario: Slug not configured

- **WHEN** no app slug is configured
- **THEN** the connect page shows no installation link and still lists accessible repositories

#### Scenario: Invalid slug

- **WHEN** the app slug contains characters other than lowercase letters, digits and hyphens
- **THEN** the app shows a configuration error naming the slug variable

### Requirement: Repository data validation and safety

Repository data from the backend SHALL be validated before it is shown. A payload with a missing field, an unknown provider, or a repository URL that is not an absolute `https` URL MUST put the page into its error state instead of rendering partial data.

#### Scenario: Unsafe URL rejected

- **WHEN** a repository in the payload has the URL `javascript:alert(1)`
- **THEN** the page shows its error state and renders no link with that URL

#### Scenario: Unknown provider rejected

- **WHEN** a repository in the payload has provider `bitbucket`
- **THEN** the page shows its error state

### Requirement: Repository data belongs to the user

Repository data SHALL be requested only while the user is signed in, and cached repository data MUST be dropped when the session ends.

#### Scenario: Signed-out user

- **WHEN** a signed-out user opens `/repositories`
- **THEN** the sign-in screen is shown and no repository data is requested

#### Scenario: Different user after sign-out

- **WHEN** a user signs out and another user signs in in the same tab
- **THEN** the repositories shown are requested for the new user and none from the previous session appear

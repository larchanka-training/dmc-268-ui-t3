# app-shell Specification

## Purpose

Provides the persistent frame of the signed-in application (sidebar navigation, header with auth status, main content area, and URL routes), so every screen shares the same chrome and new screens plug into it.

## Requirements

### Requirement: Shell layout

Signed-in screens SHALL render inside a shell with three regions: a sidebar holding the primary navigation, a header, and a main content area. The regions MUST be exposed as landmarks (`navigation` named "Main", `banner`, `main`). The shell MUST NOT be shown to signed-out users or on the OAuth callback.

#### Scenario: Signed-in user sees the shell

- **WHEN** a signed-in user opens `/runs`
- **THEN** the page has a "Main" navigation landmark, a banner landmark, and a main landmark containing the run list

#### Scenario: Signed-out user sees no shell

- **WHEN** a signed-out user opens `/runs`
- **THEN** the sign-in screen is shown without the sidebar or the user menu

#### Scenario: Skip link

- **WHEN** a keyboard user presses Tab once after the page loads
- **THEN** a visible "Skip to content" link receives focus and activating it moves focus to the main region

### Requirement: Primary navigation

The sidebar SHALL list the destinations "Repositories" (`/repositories`), "Review runs" (`/runs`) and "Settings" (`/settings`), in that order. The item for the current location MUST be marked as the current page. While a run is open, the sidebar MUST show that run as a nested item under "Review runs". While the connect screen or a repository settings page is open, "Repositories" MUST be shown as the active section.

#### Scenario: Active item

- **WHEN** the user is on `/settings`
- **THEN** the "Settings" link has `aria-current="page"` and no other navigation link does

#### Scenario: Destinations in order

- **WHEN** a signed-in user looks at the sidebar
- **THEN** the navigation links are "Repositories", "Review runs" and "Settings", in that order

#### Scenario: Connect screen under Repositories

- **WHEN** the user is on `/repositories/connect`
- **THEN** "Repositories" is shown as the active section, and no navigation link has `aria-current="page"`

#### Scenario: Repository settings under Repositories

- **WHEN** the user is on `/repositories/repo-1/settings`
- **THEN** "Repositories" is shown as the active section, "Settings" is not marked as active, and no navigation link has `aria-current="page"`

#### Scenario: Open run under Review runs

- **WHEN** the user is on `/runs/run-1`
- **THEN** "Review runs" is shown as active, and a nested link to `/runs/run-1` labelled with the run title is marked as the current page

#### Scenario: Client-side navigation

- **WHEN** the user activates "Settings" in the sidebar
- **THEN** the URL becomes `/settings` and the settings page renders without a full page reload

### Requirement: Responsive sidebar

On wide viewports, the sidebar SHALL be visible and collapsible to an icon-only rail, and the collapsed choice MUST persist across reloads in that browser. On narrow viewports, the sidebar SHALL be hidden behind a header menu button and open as a modal drawer.

#### Scenario: Collapse persists

- **WHEN** a user on a wide viewport collapses the sidebar and reloads
- **THEN** the sidebar is still collapsed, and each item still has an accessible name and a tooltip with its label

#### Scenario: Drawer on a narrow viewport

- **WHEN** a user on a narrow viewport activates the menu button
- **THEN** the navigation opens as a modal drawer with focus inside it, and Escape or choosing a destination closes it and returns focus to the menu button

### Requirement: Routes

The application SHALL serve these routes: `/` (redirects to `/repositories`), `/repositories`, `/repositories/connect`, `/repositories/$repositoryId/settings`, `/runs`, `/runs/$runId`, `/settings`, and `/auth/callback`. Any other path MUST show a not-found page inside the shell with a link to `/runs`. Route changes MUST update the document title.

#### Scenario: Root redirect

- **WHEN** a signed-in user opens `/`
- **THEN** the URL is replaced with `/repositories` and the repositories page is shown

#### Scenario: Landing after sign-in

- **WHEN** a signed-out user opens `/` and signs in successfully
- **THEN** after the callback the user lands on `/repositories`

#### Scenario: Unknown path

- **WHEN** a signed-in user opens `/nope`
- **THEN** a "Page not found" message is shown in the main region with a link to "Review runs"

#### Scenario: Document title

- **WHEN** the user opens `/settings`
- **THEN** the document title is "Settings · AI code review"

#### Scenario: Repository page titles

- **WHEN** the user opens `/repositories` and then `/repositories/connect`
- **THEN** the document title is first "Repositories · AI code review" and then "Connect repository · AI code review"

#### Scenario: Repository settings title

- **WHEN** the user opens `/repositories/repo-1/settings`
- **THEN** the document title is "Repository settings · AI code review"

#### Scenario: Repository settings deep link after sign-in

- **WHEN** a signed-out user opens `/repositories/repo-1/settings` and signs in successfully
- **THEN** after the callback the user lands on `/repositories/repo-1/settings`

### Requirement: Legacy run links

Links in the form `/?run=<id>` SHALL redirect to `/runs/<id>`, replacing the history entry, so links shared before this change keep working.

#### Scenario: Legacy link

- **WHEN** a signed-in user opens `/?run=run-1`
- **THEN** the URL is replaced with `/runs/run-1` and that run's review page is shown

### Requirement: Review runs list

The `/runs` page SHALL list the user's review runs. Each entry shows the title, repository and pull request number, run status, coverage status and creation time, and links to `/runs/$runId`. The page MUST show distinct loading, empty, and error states, and the error state MUST offer a retry.

#### Scenario: Runs listed

- **WHEN** the backend returns two runs
- **THEN** two entries are shown, newest first, each linking to its run page

#### Scenario: No runs

- **WHEN** the backend returns no runs
- **THEN** the page says there are no review runs yet

#### Scenario: Invalid payload

- **WHEN** the run list payload fails validation
- **THEN** the page shows an error with a "Retry" action and no partial list

### Requirement: Settings page

The `/settings` page SHALL show an Appearance section with the theme preference control and an Account section with the signed-in GitHub login, display name, avatar, and the current auth mode.

#### Scenario: Account details

- **WHEN** a user signed in as `octocat` in mock mode opens `/settings`
- **THEN** the Account section shows `octocat` and states that mock authentication is in use

### Requirement: Header auth status

The header SHALL show the signed-in user's avatar and GitHub login as a menu button. The menu MUST contain the user's display name and login and a "Sign out" action. When the app runs in mock auth mode, the header MUST show a "Mock auth" badge.

#### Scenario: User menu

- **WHEN** a signed-in user opens the user menu
- **THEN** it shows their display name and `@login` and a "Sign out" item, and it can be operated with the keyboard

#### Scenario: Sign out from the menu

- **WHEN** the user chooses "Sign out"
- **THEN** the session ends and the sign-in screen is shown

#### Scenario: Mock mode badge

- **WHEN** the app runs with auth mode `mock`
- **THEN** the header shows a "Mock auth" badge, and it is absent in `github` mode

### Requirement: Session restore placeholder

While the session is being restored on page load, the system SHALL show a placeholder with the shape of the shell and a loading status, instead of an empty page.

#### Scenario: Restoring

- **WHEN** the page loads and the restore request is still in flight
- **THEN** a loading status is announced, and neither the sign-in screen nor any review data is shown

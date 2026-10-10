# Spec Delta

## MODIFIED Requirements

### Requirement: Primary navigation

The sidebar SHALL list the destinations "Repositories" (`/repositories`), "Review runs" (`/runs`) and "Settings" (`/settings`), in that order. The item for the current location MUST be marked as the current page. While a run is open, the sidebar MUST show that run as a nested item under "Review runs". While the connect screen is open, "Repositories" MUST be shown as the active section.

#### Scenario: Active item

- **WHEN** the user is on `/settings`
- **THEN** the "Settings" link has `aria-current="page"` and no other navigation link does

#### Scenario: Destinations in order

- **WHEN** a signed-in user looks at the sidebar
- **THEN** the navigation links are "Repositories", "Review runs" and "Settings", in that order

#### Scenario: Connect screen under Repositories

- **WHEN** the user is on `/repositories/connect`
- **THEN** "Repositories" is shown as the active section, and no navigation link has `aria-current="page"`

#### Scenario: Open run under Review runs

- **WHEN** the user is on `/runs/run-1`
- **THEN** "Review runs" is shown as active, and a nested link to `/runs/run-1` labelled with the run title is marked as the current page

#### Scenario: Client-side navigation

- **WHEN** the user activates "Settings" in the sidebar
- **THEN** the URL becomes `/settings` and the settings page renders without a full page reload

### Requirement: Routes

The application SHALL serve these routes: `/` (redirects to `/repositories`), `/repositories`, `/repositories/connect`, `/runs`, `/runs/$runId`, `/settings`, and `/auth/callback`. Any other path MUST show a not-found page inside the shell with a link to `/runs`. Route changes MUST update the document title.

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

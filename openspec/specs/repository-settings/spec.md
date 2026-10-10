# repository-settings Specification

## Purpose

Lets a signed-in user see and change how the reviewer behaves for one connected repository, and see the reviews already run on it.

## Requirements

### Requirement: Repository settings page

The `/repositories/$repositoryId/settings` page SHALL show the repository's full name, provider, visibility and default branch, a link to its provider page that opens in a new tab without access to the opener, and a link back to "Repositories" (`/repositories`). It MUST contain a "Review settings" section, a "Rules" section and a "Review history" section.

#### Scenario: Page header

- **WHEN** the user opens the settings page of the connected repository `acme/web` (GitHub, public, default branch `main`)
- **THEN** the page heading names `acme/web`, and the page shows "GitHub", "Public", the branch `main`, an external link to the repository and a link back to "Repositories"

#### Scenario: Sections present

- **WHEN** the repository has loaded
- **THEN** the page has the sections "Review settings", "Rules" and "Review history", each with its own heading

### Requirement: Repository page states

The settings page MUST show a loading state while the repository is requested. When the repository does not exist or is not connected for the user (`404`), it MUST say the repository was not found and link to "Repositories", without a retry. Any other failure, including an invalid payload, MUST show an error with a "Retry" action and no sections.

#### Scenario: Loading

- **WHEN** the repository request is in flight
- **THEN** a loading status is announced and no section is shown

#### Scenario: Unknown repository

- **WHEN** the user opens `/repositories/unknown/settings` and the backend responds `404`
- **THEN** the page says the repository was not found and links to `/repositories`

#### Scenario: Load failure

- **WHEN** the repository request fails with `500`
- **THEN** the page shows an error alert with a "Retry" action, and activating it requests the repository again

### Requirement: Review settings values

The "Review settings" section SHALL load the repository's current settings and show them as three labelled controls: an "Automatic review" on/off switch, a "Branch filter" list of target-branch patterns (one per line, empty meaning every branch), and a "Severity threshold" choice of exactly "All", "Warning and critical" and "Only critical".

#### Scenario: Current values shown

- **WHEN** the backend returns automatic review on, branch filter `main` and `release/*`, and threshold "Warning and critical"
- **THEN** the switch is on, the branch filter shows `main` and `release/*` on separate lines, and "Warning and critical" is the selected threshold

#### Scenario: Empty branch filter

- **WHEN** the backend returns an empty branch filter
- **THEN** the branch filter is empty and the section says every target branch is reviewed

#### Scenario: Threshold meaning

- **WHEN** the user looks at the threshold options
- **THEN** each option says which severities it reports: "All" reports Critical, Warning and Info; "Warning and critical" reports Critical and Warning; "Only critical" reports Critical only

### Requirement: Review settings states

While the settings are requested, the "Review settings" section MUST show a loading state and no controls. If the request fails or its payload is invalid, the section MUST show an error with a "Retry" action and no controls, while the rest of the page stays usable.

#### Scenario: Settings load failure

- **WHEN** the settings request fails
- **THEN** the "Review settings" section shows an error alert with "Retry", and the "Rules" and "Review history" sections still load

### Requirement: Saving review settings

The section SHALL save changes only when the user activates "Save", which MUST be disabled while nothing differs from the loaded values. While saving, the controls and "Save" MUST be disabled and progress shown, and exactly one request sent. On success the section MUST announce that the settings were saved and show the saved values as current.

#### Scenario: Successful save

- **WHEN** the user turns automatic review off and activates "Save", and the backend accepts it
- **THEN** one update request with automatic review off is sent, a "Settings saved" status is announced, and "Save" is disabled again

#### Scenario: No changes

- **WHEN** the user changes the threshold and then changes it back
- **THEN** "Save" is disabled

#### Scenario: No double submission

- **WHEN** the user activates "Save" twice before the first request finishes
- **THEN** exactly one update request is sent

### Requirement: Save failure keeps edits

When saving fails, the section MUST show an error message, keep every value the user entered, and enable "Save" again. A `422` response MUST be shown as the settings being rejected by the server; other failures as a generic save error. Response bodies MUST NOT be shown.

#### Scenario: Server error

- **WHEN** saving fails with `500`
- **THEN** an error alert says the settings could not be saved, the edited values are still shown, and "Save" is enabled

#### Scenario: Rejected settings

- **WHEN** saving fails with `422`
- **THEN** the error says the server rejected the settings and the edited values are still shown

### Requirement: Branch filter validation

Before saving, the branch filter SHALL be normalised by trimming each line and dropping empty lines. A pattern containing whitespace, longer than 255 characters, or repeated MUST be reported next to the field, naming the pattern, and saving MUST be blocked until it is fixed.

#### Scenario: Blank lines ignored

- **WHEN** the user enters `main`, an empty line and `  develop  ` and saves
- **THEN** the saved branch filter is `main` and `develop`

#### Scenario: Invalid pattern

- **WHEN** the user enters the pattern `feature x`
- **THEN** the field reports that `feature x` contains whitespace and "Save" does not send a request

#### Scenario: Duplicate pattern

- **WHEN** the user enters `main` twice
- **THEN** the field reports that `main` is repeated and no request is sent

### Requirement: Repository review history

The "Review history" section SHALL list the review runs of this repository only, newest first. Each entry MUST show the run title, pull request number, run status, coverage status and creation time, and link to `/runs/$runId`. The section MUST show distinct loading, empty and error-with-"Retry" states.

#### Scenario: Runs of this repository

- **WHEN** the user has runs for `acme/web` and for `acme/api`, and opens the settings of `acme/web`
- **THEN** only the `acme/web` runs are listed, newest first, each linking to its run page

#### Scenario: No runs yet

- **WHEN** the repository has no review runs
- **THEN** the section says no reviews have run on this repository yet

#### Scenario: History load failure

- **WHEN** the runs request fails
- **THEN** the section shows an error alert with "Retry" while the other sections stay usable

### Requirement: Repository settings data validation and ownership

Settings, rules and run data for the page SHALL be validated before being shown, requested only while the user is signed in, and dropped from the cache when the session ends. A settings payload with an unknown threshold or a non-boolean automatic review flag MUST be treated as invalid.

#### Scenario: Unknown threshold rejected

- **WHEN** the settings payload has the threshold `medium_and_up`
- **THEN** the "Review settings" section shows its error state

#### Scenario: Signed-out user

- **WHEN** a signed-out user opens `/repositories/repo-1/settings`
- **THEN** the sign-in screen is shown and no repository, settings or rules data is requested

# Spec Delta

## ADDED Requirements

### Requirement: Entry point to repository settings

Each entry on the `/repositories` page SHALL offer a "Settings" link to `/repositories/$repositoryId/settings` for that repository. Its accessible name MUST name the repository.

#### Scenario: Settings link per repository

- **WHEN** the list shows `acme/web` with ID `repo-1`
- **THEN** its entry has a link named "Settings for acme/web" pointing to `/repositories/repo-1/settings`

#### Scenario: Opening settings

- **WHEN** the user activates the settings link of `acme/web`
- **THEN** the settings page of `acme/web` is shown without a full page reload

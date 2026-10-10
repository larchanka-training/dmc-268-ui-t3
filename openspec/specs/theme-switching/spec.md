# theme-switching Specification

## Purpose

Lets the user choose a light, dark, or system color theme for the whole UI, remembers that choice in the browser, and applies it before the first paint so pages never flash the wrong theme.

## Requirements

### Requirement: Theme preference

The system SHALL offer three theme preferences: Light, Dark, and System. System MUST be the default. Light and Dark MUST apply that theme to the whole UI, including code highlighting. System MUST follow the operating system's color scheme.

#### Scenario: Default

- **WHEN** a user opens the app for the first time
- **THEN** the preference is System and the UI matches the OS color scheme

#### Scenario: Choose dark

- **WHEN** the user selects Dark while the OS uses a light scheme
- **THEN** the whole UI, including syntax-highlighted code and diff colors, switches to the dark theme immediately

#### Scenario: System follows OS changes

- **WHEN** the preference is System and the OS switches from light to dark while the app is open
- **THEN** the UI switches to dark without a reload

### Requirement: Theme persistence

The theme preference SHALL persist in the browser across reloads and sessions, independently of sign-in. If stored data is missing, invalid, or storage is unavailable, the system MUST fall back to System without an error.

#### Scenario: Reload keeps the choice

- **WHEN** the user selects Light and reloads the page
- **THEN** the UI is light after the reload

#### Scenario: Survives sign-out

- **WHEN** the user selects Dark and then signs out
- **THEN** the sign-in screen is dark

#### Scenario: Unusable storage

- **WHEN** reading browser storage throws or returns an unknown value
- **THEN** the preference is System and the app works normally

### Requirement: No flash of the wrong theme

A stored Light or Dark preference SHALL be applied before the first paint of the page, so the page never briefly renders in the other theme during load.

#### Scenario: Dark preference on a light OS

- **WHEN** the stored preference is Dark, the OS uses a light scheme, and the page loads
- **THEN** the document root already carries the dark theme before the application script runs

### Requirement: Theme switcher availability

A theme switcher SHALL be reachable from the header on every signed-in screen, from the sign-in screen, and from the Appearance section of Settings. Every switcher MUST show the current preference, and changing it in one place MUST update the others.

#### Scenario: Header switcher

- **WHEN** a signed-in user opens the theme menu in the header
- **THEN** Light, Dark, and System are offered with the current one marked as selected, and the menu works with the keyboard

#### Scenario: Switchers stay in sync

- **WHEN** the user picks Dark in Settings
- **THEN** the header switcher shows Dark as selected

#### Scenario: Sign-in screen

- **WHEN** a signed-out user is on the sign-in screen
- **THEN** a theme switcher is available there

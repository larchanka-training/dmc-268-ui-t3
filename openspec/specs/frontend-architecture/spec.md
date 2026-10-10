# frontend-architecture Specification

## Purpose

Defines how the review-bot frontend is layered, how data moves from the API boundary into components, and where these decisions are recorded, so features can be built in parallel without conflicting conventions.

## Requirements

### Requirement: Layered source structure

Application source SHALL be organized into the ordered layers app, pages, widgets, features, entities, and shared. A module MUST import only from layers below its own. Within one layer, a slice MUST NOT import from another slice of that layer.

#### Scenario: Upward import is rejected

- **WHEN** a module in the entities layer imports from the features layer
- **THEN** the lint check fails and names the violating import

#### Scenario: Cross-slice import is rejected

- **WHEN** one feature slice imports from another feature slice
- **THEN** the lint check fails

#### Scenario: Downward import is allowed

- **WHEN** a widget imports from an entity and from shared
- **THEN** the lint check passes

### Requirement: Slice public API

Each slice SHALL expose its consumable members through a single public entry point. Other modules MUST import a slice only through that entry point.

#### Scenario: Deep import is rejected

- **WHEN** a module imports a file inside another slice instead of the slice's entry point
- **THEN** the lint check fails

### Requirement: Validated API boundary

Data received from the API adapter SHALL be validated against a schema before it reaches components. Data that fails validation MUST produce an error state instead of being rendered.

#### Scenario: Malformed payload

- **WHEN** the API adapter returns a finding whose severity is not one of critical, high, medium, or low
- **THEN** the query enters an error state and no partially parsed findings are displayed

### Requirement: Server state and client state separation

Data owned by the backend (review runs, diffs, findings) SHALL be held in a server-state cache keyed by run identifier. Client-only UI state that more than one component shares (diff view mode, expanded context, selected finding) SHALL be held in a client store. State used by a single component MUST stay local to that component.

#### Scenario: Switching runs does not show stale data

- **WHEN** the user switches from run A to run B while run A's request is still in flight
- **THEN** only run B's data is displayed after both requests complete

#### Scenario: View mode is shared

- **WHEN** the user switches the diff view mode from unified to split
- **THEN** every file in the open diff renders in split mode

### Requirement: Explicit loading, empty, and error states

Every view that displays server data SHALL render distinct loading, empty, error, and partial-coverage states. A run with partial or failed coverage MUST NOT be presented as a clean review.

#### Scenario: Partial coverage with no findings

- **WHEN** a run has coverage status partial and zero findings
- **THEN** the view shows that coverage is partial, lists the limitations, and does not show a "no issues" message

#### Scenario: Request error

- **WHEN** fetching a run fails
- **THEN** the view shows an error message with a retry action

### Requirement: Architecture document

The repository SHALL contain a FRONTEND_ARCHITECTURE.md at its root. It describes the layers and their import rules with a diagram, the state management split, the UI stack and design tokens, and a typed mock of the full application state for one review run. The mock state in the document MUST match the fixture types used by the application.

#### Scenario: Document covers required sections

- **WHEN** a developer opens FRONTEND_ARCHITECTURE.md
- **THEN** it contains a layer diagram, import rules, a state management section, a UI stack section, and a mock application state example

#### Scenario: Mock state stays in sync

- **WHEN** the fixture types change so that the documented mock no longer type-checks
- **THEN** the type check fails

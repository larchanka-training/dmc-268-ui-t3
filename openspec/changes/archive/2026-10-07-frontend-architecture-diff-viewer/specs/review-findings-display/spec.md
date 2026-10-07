# Spec Delta

## Purpose

Shows the AI reviewer's findings next to the code they refer to, and lets users discuss and resolve them in the UI, without hiding run coverage or treating findings as proof.

## ADDED Requirements

### Requirement: Inline finding placement

Each finding SHALL be displayed directly below the diff line that matches its anchor (file path, side LEFT or RIGHT, line number) in both unified and split modes. In split mode it is shown under the column for its side.

#### Scenario: RIGHT-side anchor in unified mode

- **WHEN** a finding is anchored to path `src/a.ts`, side RIGHT, line 12
- **THEN** the finding is shown directly below the row whose new line number is 12 in `src/a.ts`

#### Scenario: LEFT-side anchor in split mode

- **WHEN** a finding is anchored to side LEFT, line 7, and the view is split
- **THEN** the finding is shown below row 7 under the LEFT column

#### Scenario: Several findings on one line

- **WHEN** two findings share the same anchor
- **THEN** both are shown below that line in severity order, highest first

### Requirement: Findings outside the visible diff

A finding whose anchor line is inside a collapsed context gap SHALL cause that gap to reveal the anchored line. A finding whose anchor does not match any line of the diff or its available file content MUST be listed in a file-level "unplaced findings" section instead of being dropped.

#### Scenario: Anchor in collapsed context

- **WHEN** a finding is anchored to an unchanged line hidden in a collapsed gap
- **THEN** the gap is expanded enough to show that line and the finding appears below it

#### Scenario: Unmatched anchor

- **WHEN** a finding's anchor line does not exist in the file
- **THEN** the finding appears in the file's unplaced findings section

### Requirement: Finding content

A finding SHALL show its title, severity, rule identifier, evidence, impact, and recommendation, plus confidence as a percentage labeled as a model estimate. Severity MUST be conveyed with a text label as well as color. All finding text MUST be rendered as plain text or sanitized markdown that cannot execute scripts.

#### Scenario: Severity is readable without color

- **WHEN** a high-severity finding is displayed
- **THEN** the text "High" is shown next to the severity color

#### Scenario: Script in finding text

- **WHEN** a finding's evidence contains `<script>alert(1)</script>`
- **THEN** the text is displayed literally and no script runs

### Requirement: Related changed lines

A finding SHALL list its related changed lines. Activating one MUST scroll to and briefly highlight that line in the diff.

#### Scenario: Navigate to related line

- **WHEN** the user activates a related changed line reference
- **THEN** the diff scrolls to that line and highlights it

### Requirement: Finding navigation and summary

The review view SHALL show a summary with the number of findings by severity and the run's coverage status. Users MUST be able to move to the next or previous finding, which scrolls to it and marks it as selected.

#### Scenario: Next finding

- **WHEN** the user activates "next finding" while finding 2 of 5 is selected
- **THEN** finding 3 is scrolled into view and selected

### Requirement: Reply to a finding

Users SHALL be able to add a text reply to a finding. Replies are shown in a thread under the finding in creation order, with author and time. An empty or whitespace-only reply MUST be rejected. A failed submit MUST keep the typed text and show an error.

#### Scenario: Successful reply

- **WHEN** the user submits the reply "False positive, the value is checked upstream"
- **THEN** the reply appears at the end of the finding's thread

#### Scenario: Empty reply

- **WHEN** the user submits a reply containing only spaces
- **THEN** the submit is disabled and no reply is created

#### Scenario: Reply fails

- **WHEN** the reply request fails
- **THEN** an error is shown, the reply is not added to the thread, and the typed text stays in the input

### Requirement: Resolve and unresolve a finding

Users SHALL be able to mark a finding as resolved and as unresolved again. A resolved finding is shown collapsed with a resolved marker and can be expanded. The summary MUST show resolved and unresolved counts. A failed status change MUST roll back to the previous status with an error.

#### Scenario: Resolve

- **WHEN** the user resolves an open finding
- **THEN** the finding collapses with a resolved marker and the unresolved count drops by one

#### Scenario: Resolve fails

- **WHEN** the resolve request fails
- **THEN** the finding returns to its unresolved state and an error is shown

### Requirement: UI-only discussion state

Replies and resolution status SHALL belong to the review UI. They MUST NOT be presented as published to the VCS pull request, and MUST NOT change the finding's severity, rule, or content.

#### Scenario: Resolved finding keeps its content

- **WHEN** a finding is resolved
- **THEN** its title, severity, rule, and evidence are unchanged when expanded

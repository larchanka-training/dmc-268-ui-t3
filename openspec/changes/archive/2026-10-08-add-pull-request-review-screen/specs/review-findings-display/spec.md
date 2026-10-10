# Spec Delta

## ADDED Requirements

### Requirement: Severity display groups

The UI SHALL show each finding's severity as one of three groups: Critical (level `critical`), Warning (levels `high` and `medium`) and Info (level `low`). Each group MUST have its own color in light and dark themes and always a text label. Grouping MUST NOT change the four-level severity in data, validation, or ordering.

#### Scenario: Levels map to groups

- **WHEN** findings with levels critical, high, medium, and low are displayed
- **THEN** their badges read "Critical", "Warning", "Warning", and "Info" respectively

#### Scenario: Ordering still uses levels

- **WHEN** a high and a medium finding share one anchor
- **THEN** both show the "Warning" badge and the high finding is listed first

### Requirement: Expandable finding card

Each finding SHALL render as a card whose header always shows the severity badge and title. A toggle button in the header shows or hides the details. It MUST expose its state to assistive technology and work with the keyboard. Open findings MUST start expanded and resolved findings collapsed.

#### Scenario: Collapse a card

- **WHEN** the user activates the toggle of an expanded open finding
- **THEN** the evidence, impact, recommendation, and suggestion are hidden, the header stays visible, and the toggle reports collapsed

#### Scenario: Keyboard toggle

- **WHEN** a keyboard user focuses a collapsed card's toggle and presses Enter
- **THEN** the card's details are shown

### Requirement: Suggested change

When a finding has a suggested change, its card SHALL show a "Suggested change" block below the recommendation. The block shows the original head-side lines of the suggested range of the anchor's file as removed lines and the replacement as added lines, both syntax highlighted by the file's language. Without one, no block is shown.

#### Scenario: Replacement shown as a mini diff

- **WHEN** a finding on `config/settings.py` suggests replacing head lines 35–36 with `DEBUG = False`
- **THEN** the block shows lines 35 and 36 with the removed style and `-` markers, followed by `DEBUG = False` with the added style and a `+` marker

#### Scenario: No suggestion

- **WHEN** a finding has no suggested change
- **THEN** its card shows no "Suggested change" block

#### Scenario: Removal suggestion

- **WHEN** a suggested change has an empty replacement
- **THEN** the block shows only the original lines as removed and says the suggestion removes these lines

### Requirement: Suggested change without original lines

When any line of the suggested range is neither in the diff's head side nor in the available head file content, the block SHALL show only the replacement lines. It MUST also state that the original lines are not available.

#### Scenario: Original lines unavailable

- **WHEN** the suggested range is hidden context and the head file content is not available
- **THEN** the block shows the replacement lines and the note that the original lines are not available

### Requirement: Suggested change is advisory and safe

The suggested change block SHALL be labelled as an AI suggestion that has not been applied. Suggested code MUST be rendered as text and never interpreted as HTML. The UI MUST NOT offer to apply, commit, or publish a suggestion.

#### Scenario: HTML in suggested code

- **WHEN** a replacement contains `<img src=x onerror=alert(1)>`
- **THEN** the characters are displayed literally and no element is created from them

#### Scenario: No apply action

- **WHEN** a suggested change is displayed
- **THEN** the block offers no action that applies, commits, or publishes the change

### Requirement: Copy suggested code

The block SHALL offer a "Copy suggestion" action that puts exactly the replacement text on the clipboard and announces success. If copying fails, an error MUST be shown, the block MUST stay usable, and nothing is announced as copied.

#### Scenario: Copy succeeds

- **WHEN** the user activates "Copy suggestion"
- **THEN** the clipboard contains the replacement text exactly and "Copied" is announced

#### Scenario: Copy fails

- **WHEN** the clipboard write is rejected
- **THEN** an error message says the suggestion could not be copied and the action can be tried again

### Requirement: Suggested change validation

A suggested change SHALL identify a line range on the head side of the finding's file, with a positive first line, a last line not before the first, and replacement text. A finding anchored on the LEFT side MUST NOT carry one. A payload breaking these rules MUST put the review page into its error state.

#### Scenario: Inverted range rejected

- **WHEN** a finding's suggested change has first line 40 and last line 38
- **THEN** the review page shows its error state and no findings are displayed

#### Scenario: Suggestion on a LEFT anchor rejected

- **WHEN** a finding anchored to side LEFT has a suggested change
- **THEN** the review page shows its error state

### Requirement: Flagged line markers

A diff line with findings placed below it SHALL show a gutter marker in the color of the highest severity group among its unresolved findings. The marker's accessible name gives the number of findings and that group. Activating it MUST scroll to and select the first finding below that line.

#### Scenario: Marker on a flagged line

- **WHEN** a line has one Critical and one Info finding, both unresolved
- **THEN** its gutter shows a Critical marker named "2 findings, highest Critical"

#### Scenario: Marker selects the finding

- **WHEN** the user activates a line's marker
- **THEN** the first finding below that line is scrolled into view and selected

#### Scenario: All findings resolved

- **WHEN** every finding on a line is resolved
- **THEN** the marker uses the resolved style and its name says the findings are resolved

#### Scenario: Marker in both modes

- **WHEN** the view switches between unified and split mode
- **THEN** the flagged line shows its marker in both modes, on the side of its findings in split mode

## MODIFIED Requirements

### Requirement: Finding content

A finding SHALL show its title, severity group, severity level, rule identifier, evidence, impact, and recommendation, plus confidence as a percentage labeled as a model estimate. Severity MUST be conveyed with a text label as well as color: the group as a badge and the level as text. All finding text MUST be rendered as plain text or sanitized markdown that cannot execute scripts.

#### Scenario: Severity is readable without color

- **WHEN** a high-severity finding is displayed
- **THEN** the badge text "Warning" is shown next to the severity color and the level "High" is shown as text in the card

#### Scenario: Script in finding text

- **WHEN** a finding's evidence contains `<script>alert(1)</script>`
- **THEN** the text is displayed literally and no script runs

### Requirement: Finding navigation and summary

The review view SHALL show a summary with the number of findings by severity group (Critical, Warning, Info) and the run's coverage status. Users MUST be able to move to the next or previous finding, which scrolls to it and marks it as selected.

#### Scenario: Next finding

- **WHEN** the user activates "next finding" while finding 2 of 5 is selected
- **THEN** finding 3 is scrolled into view and selected

#### Scenario: Counts by group

- **WHEN** a run has one critical, two high, one medium, and one low finding
- **THEN** the summary shows Critical 1, Warning 3, and Info 1

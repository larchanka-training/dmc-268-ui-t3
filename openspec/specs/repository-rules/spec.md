# repository-rules Specification

## Purpose

Shows a user which review rules the reviewer applies to a connected repository: whether its `.review/rules.md` was found and parsed, and a read-only preview of the resulting rules.

## Requirements

### Requirement: Rules file status badge

The "Rules" section of the repository settings page SHALL show a status badge for `.review/rules.md` on the branch the backend read: "Custom rules" when the file was found and parsed, "Default rules" when it is missing, and "Rules file invalid" when it exists but could not be parsed. The status MUST be conveyed as text, not by color alone.

#### Scenario: File present

- **WHEN** the backend reports `.review/rules.md` found and parsed on `main`
- **THEN** the badge reads "Custom rules"

#### Scenario: File missing

- **WHEN** the backend reports no `.review/rules.md` on `main`
- **THEN** the badge reads "Default rules"

#### Scenario: File invalid

- **WHEN** the backend reports `.review/rules.md` exists but failed to parse
- **THEN** the badge reads "Rules file invalid"

### Requirement: Rules source details

The section SHALL show the branch the rules were read from and the rules version. When the file was read, it MUST also show the short commit SHA and link to the file on the provider, opening in a new tab without access to the opener.

#### Scenario: Source of custom rules

- **WHEN** the rules were read from `.review/rules.md` on `main` at commit `3f2a9c1…` with version `rules-2026-10-01`
- **THEN** the section shows `main`, `3f2a9c1`, `rules-2026-10-01`, and a link to the file on the provider

#### Scenario: Default rules have no file link

- **WHEN** the default rules are in use because the file is missing
- **THEN** no file link or commit SHA is shown

### Requirement: Default rules warning

When `.review/rules.md` is missing, the section MUST show a warning with the text "Default rules are being used; create `.review/rules.md`" and name the branch it was looked for on.

#### Scenario: Warning for a missing file

- **WHEN** the backend reports no rules file on `develop`
- **THEN** a warning says "Default rules are being used; create `.review/rules.md`" and mentions `develop`

### Requirement: Invalid rules file warning

When `.review/rules.md` exists but could not be parsed, the section MUST show a warning that the file could not be read and the default rules are being used, followed by each parse problem the backend reports, with its line number when given. Problems MUST be shown as plain text.

#### Scenario: Parse problems listed

- **WHEN** the backend reports the problems "Unknown severity `urgent`" on line 12 and "Missing rule ID" without a line
- **THEN** the warning lists "Line 12: Unknown severity `urgent`" and "Missing rule ID"

#### Scenario: Markup in a problem is not rendered

- **WHEN** a reported problem contains `<img src=x onerror=alert(1)>`
- **THEN** that text is shown literally and no image element is created

### Requirement: Rules preview

The section SHALL show a read-only list of the rules in effect (the parsed custom rules, or the default rules), ordered as the backend returns them. Each rule MUST show its ID, title, severity (as text with its display group), category, whether it is enabled, and its description. The preview MUST NOT offer any editing control.

#### Scenario: Parsed rules listed

- **WHEN** the backend returns the rules `SEC-001` (critical, enabled) and `STY-004` (low, disabled)
- **THEN** both are listed in that order with their IDs, titles, categories and descriptions, `SEC-001` is shown as Critical and enabled, and `STY-004` as Low (Info) and disabled

#### Scenario: Default rules previewed

- **WHEN** the file is missing and the backend returns the default rules
- **THEN** the default rules are listed under the warning

#### Scenario: Read-only

- **WHEN** the user looks at the preview
- **THEN** there is no input, switch or button that changes a rule

### Requirement: Empty rule set

When the rules in effect contain no rules, the section MUST say that no rules are enabled and that the reviewer will report no findings.

#### Scenario: No rules

- **WHEN** the backend returns an empty rule list
- **THEN** the section says no rules are enabled and the reviewer reports no findings

### Requirement: Rules section states

While the rules status is requested, the section MUST show a loading state. If the request fails or its payload is invalid, it MUST show an error with a "Retry" action and no badge or preview, while the rest of the page stays usable. A payload with an unknown status or severity, or a file URL that is not an absolute `https` URL, MUST be treated as invalid.

#### Scenario: Rules load failure

- **WHEN** the rules request fails
- **THEN** the "Rules" section shows an error alert with "Retry", and activating it requests the rules again

#### Scenario: Unsafe file URL rejected

- **WHEN** the rules payload has the file URL `javascript:alert(1)`
- **THEN** the section shows its error state and renders no link with that URL

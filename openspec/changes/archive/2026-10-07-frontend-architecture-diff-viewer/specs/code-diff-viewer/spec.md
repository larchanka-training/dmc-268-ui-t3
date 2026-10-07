# Spec Delta

## Purpose

Shows source code and code changes in the review UI: plain code snippets, plus unified or side-by-side diffs with line numbers, change highlighting, syntax highlighting, and context the user can expand.

## ADDED Requirements

### Requirement: Code block rendering

The system SHALL render a read-only code snippet with a line number on each line, starting from a given first line number. Lines the caller selects MUST be visually highlighted.

#### Scenario: Snippet with offset and highlighted line

- **WHEN** a snippet of 5 lines is rendered starting at line 40 with line 42 highlighted
- **THEN** lines are numbered 40 through 44 and only line 42 has the highlight style

### Requirement: Unified diff parsing

The system SHALL parse unified diff text into files, hunks, and lines. Each line is classified as added, removed, or context, with its old and new line numbers. Renamed, added, deleted, and binary files MUST be identified. Input it cannot parse MUST produce an error result instead of a partial diff.

#### Scenario: Line numbering inside a hunk

- **WHEN** a hunk header `@@ -10,3 +10,4 @@` is followed by one context line, one removed line, two added lines, and one context line
- **THEN** the lines receive old/new numbers 10/10, 11/–, –/11, –/12, and 12/13

#### Scenario: Renamed file

- **WHEN** a file section declares `rename from a.ts` and `rename to b.ts`
- **THEN** the parsed file records old path a.ts and new path b.ts

#### Scenario: Binary file

- **WHEN** a file section contains `Binary files ... differ`
- **THEN** the file is marked binary and has no hunks

#### Scenario: Malformed hunk header

- **WHEN** a hunk header cannot be parsed
- **THEN** parsing returns an error and nothing is rendered as a diff

### Requirement: Unified diff view

The system SHALL render each file's hunks in one column, showing the old and new line number gutters, a change marker, and a distinct background for added, removed, and context lines.

#### Scenario: Added and removed lines are distinguishable

- **WHEN** a hunk with added and removed lines is shown in unified mode
- **THEN** added lines show `+` with the added style, removed lines show `-` with the removed style, and context lines show neither

### Requirement: Split diff view

The system SHALL render each file's hunks in two columns: old (LEFT) and new (RIGHT). Removed and added lines in the same change block are paired row by row, and an empty filler cell is shown where one side has no counterpart.

#### Scenario: Unequal change block

- **WHEN** a change block removes 1 line and adds 3 lines
- **THEN** the first row pairs the removed line with the first added line, and the next two rows show the added lines with an empty LEFT cell

#### Scenario: Toggle preserves position

- **WHEN** the user toggles between unified and split mode
- **THEN** the same files, hunks, expanded context, and inline findings are shown

### Requirement: Syntax highlighting

Code lines SHALL be syntax highlighted based on the file's language, determined from its extension. Highlighting MUST keep the added, removed, and context backgrounds. Files in unknown languages MUST render as plain text. Code text MUST be rendered as text and never interpreted as HTML.

#### Scenario: Known language

- **WHEN** a `.ts` file diff is rendered
- **THEN** keywords, strings, and comments are colored and added/removed backgrounds are still visible

#### Scenario: Unknown language

- **WHEN** a file with an unrecognized extension is rendered
- **THEN** its lines render as plain text without an error

#### Scenario: HTML in code is not executed

- **WHEN** a diff line contains `<img src=x onerror=alert(1)>`
- **THEN** the characters are displayed literally and no element is created from them

### Requirement: Expandable context

When the full file content is available, the system SHALL show a collapsed-gap control for unchanged lines hidden between hunks, before the first hunk, and after the last hunk. The control reveals a fixed number of lines or the whole gap. When the full file content is not available, the gap MUST be shown as not expandable.

#### Scenario: Expand part of a gap

- **WHEN** a 50-line gap is collapsed and the user activates "expand 20 lines" (an assumed step size)
- **THEN** 20 more context lines appear with correct old and new line numbers, and the control shows the 30 remaining lines

#### Scenario: Expand whole gap

- **WHEN** the user activates "expand all" on a gap
- **THEN** all hidden lines in that gap appear and the control is removed

#### Scenario: File content unavailable

- **WHEN** the full file content for a diff file is not available
- **THEN** gaps show their hidden line count without an expand action

### Requirement: File-level presentation

Each file in a diff SHALL have a header with its path (old → new for renames), change type, and added/removed line counts. The file body MUST be collapsible. Binary files MUST show a "binary file not shown" notice in place of the body.

#### Scenario: Collapse a file

- **WHEN** the user collapses a file header
- **THEN** the file's body is hidden and the header stays visible with its counts

### Requirement: Keyboard and screen-reader access

Interactive diff controls (file collapse, view-mode toggle, context expansion) SHALL be operable by keyboard and have accessible names. Each diff line MUST expose its change type to assistive technology, not only through color.

#### Scenario: Keyboard expansion

- **WHEN** a user focuses an expand-context control with Tab and presses Enter
- **THEN** the context expands the same way a click does

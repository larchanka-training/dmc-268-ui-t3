# Spec Delta

## Purpose

Identifies the pull request a review run belongs to and states the overall outcome of the AI review, so a reader can tell at a glance what changed, who changed it, and whether the review found blocking problems.

## ADDED Requirements

### Requirement: Pull request identity header

The review page SHALL start with a header showing the pull request title as the page heading, the repository full name, and the pull request number. It MUST also show the head commit as a short (7-character) SHA.

#### Scenario: Header for a run

- **WHEN** the run for `larchanka-training/dmc-268-demo` pull request 42 titled "Add user search endpoint" is opened
- **THEN** the page heading is "Add user search endpoint" and the header shows `larchanka-training/dmc-268-demo`, `#42`, and the first 7 characters of the head SHA

### Requirement: Pull request author

When the run payload names the pull request author, the header SHALL show the author's login with their avatar. If no avatar URL is available, it MUST show a fallback avatar with the login's initial. If the author is not provided at all, the header MUST leave the author out and show no placeholder text.

#### Scenario: Author with avatar

- **WHEN** the run's author is `octocat` with an avatar URL
- **THEN** the header shows the avatar image with the alternative text "octocat" and the login `octocat`

#### Scenario: Author without avatar

- **WHEN** the run's author is `octocat` and the avatar URL is null
- **THEN** the header shows a fallback avatar containing "O" and the login `octocat`

#### Scenario: Author unknown

- **WHEN** the run payload has no author
- **THEN** the header shows no author element and no "unknown" text

### Requirement: Pull request branches

When base and head branch names are provided, the header SHALL show them as `base ← head`, each in code style. A screen reader MUST hear this as merging the head branch into the base branch. If either name is missing, the branch element MUST be left out.

#### Scenario: Branches shown

- **WHEN** the run has base branch `main` and head branch `feature/search`
- **THEN** the header shows `main ← feature/search` and its accessible text says `feature/search` is merged into `main`

#### Scenario: Branch missing

- **WHEN** the run has a base branch but no head branch
- **THEN** no branch element is shown

### Requirement: Link to the pull request

When a pull request URL is provided, the header SHALL show a link to the pull request on its provider. The link opens in a new tab and MUST NOT give that page access to the opener. The URL MUST be an absolute `https` URL. Any other URL MUST put the page into its error state and render no link.

#### Scenario: Open on the provider

- **WHEN** the user activates the pull request link
- **THEN** the provider page opens in a new tab with `noopener` and `noreferrer`

#### Scenario: Unsafe URL rejected

- **WHEN** the run payload has the pull request URL `javascript:alert(1)`
- **THEN** the review page shows its error state with a "Retry" action and no link with that URL is rendered

#### Scenario: Unsafe avatar URL rejected

- **WHEN** the run payload has an author avatar URL that is not an absolute `https` URL
- **THEN** the review page shows its error state

### Requirement: Review status in the header

The header SHALL show the existing run status, coverage status, and publication status badges next to the pull request identity. When the payload has none of the optional metadata, the header MUST still render the title, repository, number, SHA, and these badges.

#### Scenario: Older payload without metadata

- **WHEN** the run payload has no author, branches, or pull request URL
- **THEN** the header shows the title, repository, number, short SHA, and the run, coverage, and publication badges, and the page does not enter an error state

### Requirement: Overall verdict

The header SHALL show one overall verdict, derived from the run status, the coverage status, and the findings' severity groups. The order of checks is given in the scenarios, and the first matching rule wins. A verdict MUST be shown as text and not only as color. Resolving a finding MUST NOT change the verdict.

#### Scenario: Run still in progress

- **WHEN** the run status is NEW, QUEUED, or RUNNING
- **THEN** the verdict is "Review in progress"

#### Scenario: Run did not produce a review

- **WHEN** the run status is FAILED or CANCELLED, or the coverage status is failed
- **THEN** the verdict is "No verdict" with the explanation that the change was not reviewed

#### Scenario: Critical finding present

- **WHEN** a completed run has at least one finding in the Critical group
- **THEN** the verdict is "Changes requested"

#### Scenario: Only warnings and info

- **WHEN** a completed run has no Critical findings and at least one Warning finding
- **THEN** the verdict is "Needs attention"

#### Scenario: Partial coverage never passes

- **WHEN** a completed run has partial coverage and no Critical or Warning findings
- **THEN** the verdict is "Partially reviewed", and no passing verdict or "no issues" message is shown

#### Scenario: Clean complete review

- **WHEN** a completed run has complete coverage and only Info findings or no findings
- **THEN** the verdict is "No blocking issues"

#### Scenario: Resolving does not change the verdict

- **WHEN** the user resolves the only Critical finding of a completed run
- **THEN** the verdict stays "Changes requested"

### Requirement: Review score

For a completed run with complete coverage, the header SHALL show a score from 0 to 100: 100 minus 25 per critical, 8 per high, 4 per medium, and 1 per low finding, floored at 0. It MUST be labelled as a heuristic, not a quality guarantee. No score MUST be shown in any other case.

#### Scenario: Score with findings

- **WHEN** a completed run with complete coverage has one critical, two high, one medium, and one low finding
- **THEN** the score shown is 54 out of 100

#### Scenario: Score floored at zero

- **WHEN** a completed run with complete coverage has five critical findings
- **THEN** the score shown is 0 out of 100

#### Scenario: No score for partial coverage

- **WHEN** a completed run has partial coverage
- **THEN** no numeric score is shown and the header says the score is unavailable because coverage is partial

#### Scenario: No score while running

- **WHEN** the run status is RUNNING
- **THEN** no numeric score is shown

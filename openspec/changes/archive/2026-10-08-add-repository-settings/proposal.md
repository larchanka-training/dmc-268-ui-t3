# Proposal

## Why

Connecting a repository is the only thing the UI lets a user do with it today. Users cannot see or change how the reviewer behaves for that repository, cannot tell whether their `.review/rules.md` was found and understood, and cannot see the reviews already run on it. Without that, a user who writes custom rules has no way to check that the reviewer picked them up, short of waiting for a review.

## What Changes

- New page `/repositories/$repositoryId/settings` ("Repository settings"), opened from a new "Settings" action on each connected repository on `/repositories`.
- **Review settings** form with three options and an explicit "Save":
  - **Automatic review** on/off: review pull requests when they are opened or updated.
  - **Branch filter**: target-branch patterns (for example `main`, `release/*`); an empty filter means every branch.
  - **Severity threshold**: "All", "Warning and critical" or "Only critical", the lowest severity the reviewer reports.
    The page loads the current values, saves them, and shows saving, saved and failed states without losing what the user typed.
- **Rules status** panel:
  - A badge saying whether `.review/rules.md` exists on the repository's default branch, which branch and commit were read, and the rules version.
  - A read-only preview of the rules the backend parsed from the file: rule ID, title, severity, category, enabled state and description.
  - When the file is missing, a warning: "Default rules are being used; create `.review/rules.md`", with the default rules shown in the same preview.
  - When the file exists but could not be parsed, a warning that names the parse problems and says the default rules are being used.
- **Review history** section: this repository's review runs, newest first, each linking to `/runs/$runId`, with the run and coverage statuses already used on `/runs`.
- Proposed backend endpoints (mock adapter only, as with the earlier repository screens): get one repository, get and update its review settings, and get its rules status. They are documented as unapproved.
- "Repositories" stays the active sidebar section on the new page.

## Capabilities

### New Capabilities

- `repository-settings`: the per-repository settings page — loading and saving the review settings (automatic review, branch filter, severity threshold), its states and validation, and the repository's review history.
- `repository-rules`: how the UI reports a repository's review rules — presence of `.review/rules.md`, the default-rules and parse-error warnings, and the read-only preview of the parsed rules.

### Modified Capabilities

- `repository-management`: each connected repository offers a "Settings" link to its settings page.
- `app-shell`: the route list gains `/repositories/$repositoryId/settings` with its document title, and "Repositories" is the active sidebar section on it.

## Impact

- **Code:** `shared/api` (`ReviewApi` methods, wire types, mock adapter and fixtures, `?mockFail=` list), `entities/repository` (single-repository query), new `entities/review-settings` and `entities/review-rules`, new `features/update-review-settings`, new `pages/repository-settings`, `pages/repositories` (Settings link), `app/router.tsx`, `app/ui/routes.tsx`, `widgets/app-shell` (`NavList` section highlight), `shared/ui` (switch and radio group primitives from `radix-ui`, already a dependency).
- **APIs (proposed, not approved):** `GET /repositories/{id}`, `GET`/`PUT /repositories/{id}/settings`, `GET /repositories/{id}/rules`, and filtering runs by repository. The backend owns parsing `.review/rules.md`, the default rule set and the rule format; the UI only shows what it returns.
- **Docs:** `FRONTEND_ARCHITECTURE.md` routes, server-state keys and proposed endpoints.
- **Dependencies:** none new.
- **Out of scope:** editing rules in the UI, committing `.review/rules.md`, choosing the branch the rules are read from, and acting on the settings (the backend applies them).

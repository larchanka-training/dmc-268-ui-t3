/**
 * Wire DTOs: the JSON shapes the backend is expected to send (snake_case).
 * The backend contract is not final yet (see .agents/rules/project-context.md);
 * only the API adapter and the entity Zod schemas depend on these shapes.
 */

export type RunStatusWire = 'NEW' | 'QUEUED' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED'
export type CoverageStatusWire = 'complete' | 'partial' | 'failed'
export type PublicationStatusWire = 'not_published' | 'pending' | 'published' | 'failed'
export type SeverityWire = 'critical' | 'high' | 'medium' | 'low'
export type SideWire = 'LEFT' | 'RIGHT'
export type FindingStatusWire = 'open' | 'resolved'

export interface LineAnchorWire {
  path: string
  side: SideWire
  line: number
}

export interface ReviewRunWire {
  run_id: string
  title: string
  repository: string
  pull_request: number
  status: RunStatusWire
  coverage: { status: CoverageStatusWire; limitations: string[] }
  publication: { status: PublicationStatusWire }
  base_sha: string
  head_sha: string
  rules_version: string
  created_at: string
  /** Proposed: the pull request author. Absent or null when the provider data is unavailable. */
  author?: PullRequestAuthorWire | null
  /** Proposed: target branch name of the pull request. */
  base_branch?: string | null
  /** Proposed: source branch name of the pull request. */
  head_branch?: string | null
  /** Proposed: absolute https web URL of the pull request on the provider. */
  pull_request_url?: string | null
}

export interface PullRequestAuthorWire {
  login: string
  /** Absolute https URL, or null when the provider has no avatar. */
  avatar_url: string | null
}

/**
 * Proposed: a replacement for head-side (RIGHT) lines `start_line`..`end_line` of the
 * finding's anchor file. An empty `replacement` suggests removing those lines.
 */
export interface SuggestedChangeWire {
  start_line: number
  end_line: number
  replacement: string
}

export interface ReplyWire {
  reply_id: string
  author: string
  body: string
  created_at: string
}

export interface FindingWire {
  finding_id: string
  rule_id: string
  title: string
  severity: SeverityWire
  anchor: LineAnchorWire
  related_changed_lines: LineAnchorWire[]
  evidence: string
  impact: string
  recommendation: string
  confidence: number
  status: FindingStatusWire
  replies: ReplyWire[]
  /** Proposed: suggested code for the anchored range; never on a LEFT anchor. */
  suggested_change?: SuggestedChangeWire | null
}

export type VcsProviderWire = 'github' | 'gitlab'

/** A repository connected to the reviewer (proposed `GET /repositories` item). */
export interface RepositoryWire {
  repository_id: string
  provider: VcsProviderWire
  /** The provider's repository ID as a string (GitHub repository ID, GitLab project ID). */
  external_id: string
  /** `owner/name`, or `group/subgroup/name` on GitLab. */
  full_name: string
  /** Absolute https web URL on the provider. */
  url: string
  default_branch: string
  private: boolean
  connected_at: string
}

/** A repository the user can access (proposed `GET /repositories/available` item). */
export interface AvailableRepositoryWire {
  provider: VcsProviderWire
  external_id: string
  full_name: string
  url: string
  default_branch: string
  private: boolean
  /** Set when this repository is already connected. */
  repository_id: string | null
}

/** The lowest severity display group the reviewer reports for a repository (proposed). */
export type SeverityThresholdWire = 'all' | 'warning_and_critical' | 'critical_only'

/** A repository's review settings (proposed `GET`/`PUT /repositories/{id}/settings`). */
export interface ReviewSettingsWire {
  auto_review: boolean
  /** Target-branch patterns; `*` matches within a path segment. Empty means every branch. */
  branch_filter: string[]
  severity_threshold: SeverityThresholdWire
  updated_at: string
}

/** `custom`: `.review/rules.md` was parsed; `missing`: no file; `invalid`: the file failed to parse. */
export type RulesFileStatusWire = 'custom' | 'missing' | 'invalid'

/** A review rule as parsed by the backend. */
export interface RuleWire {
  rule_id: string
  title: string
  description: string
  category: string
  severity: SeverityWire
  enabled: boolean
}

export interface RulesProblemWire {
  message: string
  /** 1-based line in the rules file, or null when the problem has no single line. */
  line: number | null
}

/** The rules in effect for a repository (proposed `GET /repositories/{id}/rules`). */
export interface RepositoryRulesWire {
  status: RulesFileStatusWire
  /** Path of the rules file, `.review/rules.md`. */
  path: string
  /** The branch that was read: the default branch in v1. */
  branch: string
  /** Commit that was read; null when the file is missing. */
  commit_sha: string | null
  /** Absolute https web URL of the file; null when the file is missing. */
  file_url: string | null
  rules_version: string
  /** Non-empty only when `status` is `invalid`. */
  problems: RulesProblemWire[]
  /** The rules in effect: the parsed custom rules, or the defaults. */
  rules: RuleWire[]
}

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
}

import type { Severity, SeverityGroup } from '@/entities/finding'
import type { CoverageStatus, RunStatus } from '@/entities/review-run'

export type Verdict =
  | 'in_progress'
  | 'no_verdict'
  | 'changes_requested'
  | 'needs_attention'
  | 'partially_reviewed'
  | 'no_blocking_issues'

export const VERDICT_LABEL: Record<Verdict, string> = {
  in_progress: 'Review in progress',
  no_verdict: 'No verdict',
  changes_requested: 'Changes requested',
  needs_attention: 'Needs attention',
  partially_reviewed: 'Partially reviewed',
  no_blocking_issues: 'No blocking issues',
}

interface VerdictInput {
  runStatus: RunStatus
  coverageStatus: CoverageStatus
  /** Counts over all findings, resolved or not: resolution is UI-only and proves no fix. */
  groupCounts: Record<SeverityGroup, number>
}

const IN_PROGRESS: ReadonlySet<RunStatus> = new Set(['NEW', 'QUEUED', 'RUNNING'])

/** The overall verdict; the first matching rule wins. */
export function deriveVerdict({ runStatus, coverageStatus, groupCounts }: VerdictInput): Verdict {
  if (IN_PROGRESS.has(runStatus)) return 'in_progress'
  if (runStatus !== 'COMPLETED' || coverageStatus === 'failed') return 'no_verdict'
  if (groupCounts.critical > 0) return 'changes_requested'
  if (groupCounts.warning > 0) return 'needs_attention'
  if (coverageStatus === 'partial') return 'partially_reviewed'
  return 'no_blocking_issues'
}

/** Points deducted per finding of each severity level. */
export const SCORE_WEIGHTS: Record<Severity, number> = {
  critical: 25,
  high: 8,
  medium: 4,
  low: 1,
}

interface ScoreInput {
  runStatus: RunStatus
  coverageStatus: CoverageStatus
  levelCounts: Record<Severity, number>
}

/** A 0–100 heuristic score, only for a completed run with complete coverage; otherwise null. */
export function deriveScore({ runStatus, coverageStatus, levelCounts }: ScoreInput): number | null {
  if (runStatus !== 'COMPLETED' || coverageStatus !== 'complete') return null
  const deducted = (Object.keys(SCORE_WEIGHTS) as Severity[]).reduce(
    (sum, level) => sum + SCORE_WEIGHTS[level] * levelCounts[level],
    0,
  )
  return Math.max(0, 100 - deducted)
}

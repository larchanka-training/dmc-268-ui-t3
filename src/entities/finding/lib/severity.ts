import {
  SEVERITIES,
  SEVERITY_GROUPS,
  severityGroup,
  type Severity,
  type SeverityGroup,
} from '@/shared/lib/severity'
import type { Finding } from '../model/schema'

export {
  GROUP_LABEL,
  SEVERITY_GROUPS,
  SEVERITY_LABEL,
  severityGroup,
  type SeverityGroup,
} from '@/shared/lib/severity'

/** Highest severity first; stable for equal severities. */
export function sortBySeverity<T extends Pick<Finding, 'severity'>>(findings: readonly T[]): T[] {
  return [...findings].sort(
    (a, b) => SEVERITIES.indexOf(a.severity) - SEVERITIES.indexOf(b.severity),
  )
}

export function countBySeverity(
  findings: readonly Pick<Finding, 'severity'>[],
): Record<Severity, number> {
  const counts: Record<Severity, number> = { critical: 0, high: 0, medium: 0, low: 0 }
  for (const finding of findings) counts[finding.severity]++
  return counts
}

export function countByGroup(
  findings: readonly Pick<Finding, 'severity'>[],
): Record<SeverityGroup, number> {
  const counts: Record<SeverityGroup, number> = { critical: 0, warning: 0, info: 0 }
  for (const finding of findings) counts[severityGroup(finding.severity)]++
  return counts
}

/** The highest display group among the findings, or null when there are none. */
export function highestGroup(findings: readonly Pick<Finding, 'severity'>[]): SeverityGroup | null {
  const groups = new Set(findings.map((finding) => severityGroup(finding.severity)))
  return SEVERITY_GROUPS.find((group) => groups.has(group)) ?? null
}

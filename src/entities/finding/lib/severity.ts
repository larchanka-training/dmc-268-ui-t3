import { SEVERITIES, type Finding, type Severity } from '../model/schema'

export const SEVERITY_LABEL: Record<Severity, string> = {
  critical: 'Critical',
  high: 'High',
  medium: 'Medium',
  low: 'Low',
}

/** Display groups, highest first. A UI mapping only: data, validation and ordering keep the levels. */
export const SEVERITY_GROUPS = ['critical', 'warning', 'info'] as const
export type SeverityGroup = (typeof SEVERITY_GROUPS)[number]

const GROUP_OF: Record<Severity, SeverityGroup> = {
  critical: 'critical',
  high: 'warning',
  medium: 'warning',
  low: 'info',
}

export const GROUP_LABEL: Record<SeverityGroup, string> = {
  critical: 'Critical',
  warning: 'Warning',
  info: 'Info',
}

export function severityGroup(severity: Severity): SeverityGroup {
  return GROUP_OF[severity]
}

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

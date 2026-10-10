import { SEVERITIES, type Finding, type Severity } from '../model/schema'

export const SEVERITY_LABEL: Record<Severity, string> = {
  critical: 'Critical',
  high: 'High',
  medium: 'Medium',
  low: 'Low',
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

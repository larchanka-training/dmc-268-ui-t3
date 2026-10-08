/**
 * Severity levels and their display groups, shared by findings and review rules.
 * The wire contract keeps four levels; the UI shows three groups.
 */
export const SEVERITIES = ['critical', 'high', 'medium', 'low'] as const
export type Severity = (typeof SEVERITIES)[number]

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

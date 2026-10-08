import { GROUP_LABEL, SEVERITY_LABEL, severityGroup, type Severity } from '@/shared/lib/severity'

/** The level, plus its display group when the names differ: "Critical", "High (Warning)", "Low (Info)". */
export function ruleSeverityLabel(severity: Severity): string {
  const level = SEVERITY_LABEL[severity]
  const group = GROUP_LABEL[severityGroup(severity)]
  return level === group ? level : `${level} (${group})`
}

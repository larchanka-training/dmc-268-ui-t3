import { severityGroup, type Severity } from '@/shared/lib/severity'
import { SeverityGroupBadge } from '@/shared/ui/severity-group-badge'

export { SeverityGroupBadge }

/** The display group of a finding's severity level. */
export function SeverityBadge({ severity, className }: { severity: Severity; className?: string }) {
  return <SeverityGroupBadge group={severityGroup(severity)} className={className} />
}

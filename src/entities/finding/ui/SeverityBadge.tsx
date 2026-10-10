import { cn } from '@/shared/lib/cn'
import { GROUP_LABEL, severityGroup, type SeverityGroup } from '../lib/severity'
import type { Severity } from '../model/schema'

const STYLE: Record<SeverityGroup, string> = {
  critical: 'bg-severity-critical-bg text-severity-critical',
  warning: 'bg-severity-warning-bg text-severity-warning',
  info: 'bg-severity-info-bg text-severity-info',
}

/** A severity display group as a colored label; the text carries the meaning, color only reinforces it. */
export function SeverityGroupBadge({
  group,
  className,
}: {
  group: SeverityGroup
  className?: string
}) {
  return (
    <span
      data-severity-group={group}
      className={cn(
        'inline-flex items-center rounded px-1.5 py-0.5 text-xs font-semibold',
        STYLE[group],
        className,
      )}
    >
      {GROUP_LABEL[group]}
    </span>
  )
}

/** The display group of a finding's severity level. */
export function SeverityBadge({ severity, className }: { severity: Severity; className?: string }) {
  return <SeverityGroupBadge group={severityGroup(severity)} className={className} />
}

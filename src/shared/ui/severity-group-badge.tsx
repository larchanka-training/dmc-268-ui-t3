import type * as React from 'react'
import { cn } from '@/shared/lib/cn'
import { GROUP_LABEL, type SeverityGroup } from '@/shared/lib/severity'

const STYLE: Record<SeverityGroup, string> = {
  critical: 'bg-severity-critical-bg text-severity-critical',
  warning: 'bg-severity-warning-bg text-severity-warning',
  info: 'bg-severity-info-bg text-severity-info',
}

/** A severity display group as a colored label; the text carries the meaning, color only reinforces it. */
export function SeverityGroupBadge({
  group,
  className,
  children,
}: {
  group: SeverityGroup
  className?: string
  /** Replaces the group label, for example to name the level as well. */
  children?: React.ReactNode
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
      {children ?? GROUP_LABEL[group]}
    </span>
  )
}

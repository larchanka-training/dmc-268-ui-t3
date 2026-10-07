import { cn } from '@/shared/lib/cn'
import { SEVERITY_LABEL } from '../lib/severity'
import type { Severity } from '../model/schema'

const STYLE: Record<Severity, string> = {
  critical: 'bg-severity-critical-bg text-severity-critical',
  high: 'bg-severity-high-bg text-severity-high',
  medium: 'bg-severity-medium-bg text-severity-medium',
  low: 'bg-severity-low-bg text-severity-low',
}

/** Severity as a colored label; the text carries the meaning, color only reinforces it. */
export function SeverityBadge({ severity, className }: { severity: Severity; className?: string }) {
  return (
    <span
      data-severity={severity}
      className={cn(
        'inline-flex items-center rounded px-1.5 py-0.5 text-xs font-semibold',
        STYLE[severity],
        className,
      )}
    >
      {SEVERITY_LABEL[severity]}
    </span>
  )
}

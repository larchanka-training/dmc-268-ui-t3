import {
  GROUP_LABEL,
  highestGroup,
  sortBySeverity,
  useFindingNavActions,
  type Finding,
  type SeverityGroup,
} from '@/entities/finding'
import { cn } from '@/shared/lib/cn'

const DOT: Record<SeverityGroup, string> = {
  critical: 'bg-severity-critical',
  warning: 'bg-severity-warning',
  info: 'bg-severity-info',
}

function markerLabel(findings: readonly Finding[]): string {
  const count = `${String(findings.length)} ${findings.length === 1 ? 'finding' : 'findings'}`
  const group = highestGroup(findings.filter((finding) => finding.status !== 'resolved'))
  if (!group) return `${count}, all resolved`
  return `${count}, highest ${GROUP_LABEL[group]}`
}

/**
 * Gutter marker for a diff line with findings below it: colored by the highest
 * severity group among its unresolved findings; activating it selects the first one.
 * `findings` must not be empty.
 */
export function FlaggedLineMarker({ findings }: { findings: readonly Finding[] }) {
  const { selectFinding } = useFindingNavActions()
  const [first] = sortBySeverity(findings)
  const group = highestGroup(findings.filter((finding) => finding.status !== 'resolved'))
  return (
    <button
      type="button"
      aria-label={markerLabel(findings)}
      title={markerLabel(findings)}
      data-severity-group={group ?? 'resolved'}
      className="flex size-4 items-center justify-center rounded-sm focus-visible:outline-2 focus-visible:outline-ring"
      onClick={() => {
        selectFinding(first.id)
      }}
    >
      <span
        aria-hidden="true"
        className={cn(
          'block size-2 rounded-full',
          group ? DOT[group] : 'border border-muted-foreground bg-transparent',
        )}
      />
    </button>
  )
}

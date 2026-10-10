import { ChevronDown, ChevronRight, CircleCheck } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { cn } from '@/shared/lib/cn'
import type { LineAnchor } from '@/shared/lib/line-anchor'
import { Button } from '@/shared/ui/button'
import { findingElementId } from '../lib/dom'
import type { Finding } from '../model/schema'
import { ReplyThread } from './ReplyThread'
import { SeverityBadge } from './SeverityBadge'

interface FindingCardProps {
  finding: Finding
  /** Controls in the card header (e.g. resolve toggle). */
  actions?: ReactNode
  /** Content below the replies (e.g. reply form). */
  footer?: ReactNode
  selected?: boolean
  onRelatedLineClick?: (anchor: LineAnchor) => void
}

function Section({ label, children }: { label: string; children: string }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </dt>
      <dd className="whitespace-pre-wrap break-words">{children}</dd>
    </div>
  )
}

/**
 * One AI review finding. All model-produced text is rendered as plain React
 * text, so markup in it is shown literally and never executed.
 */
export function FindingCard({
  finding,
  actions,
  footer,
  selected = false,
  onRelatedLineClick,
}: FindingCardProps) {
  const resolved = finding.status === 'resolved'
  const [expanded, setExpanded] = useState(!resolved)
  const [wasResolved, setWasResolved] = useState(resolved)
  if (resolved !== wasResolved) {
    // Collapse when the finding becomes resolved, expand when it is reopened.
    setWasResolved(resolved)
    setExpanded(!resolved)
  }
  const detailsId = `${findingElementId(finding.id)}-details`

  return (
    <article
      id={findingElementId(finding.id)}
      aria-label={`Finding: ${finding.title}`}
      data-selected={selected || undefined}
      data-status={finding.status}
      className={cn(
        'scroll-mt-24 rounded-md border bg-card text-sm text-card-foreground shadow-xs',
        selected && 'ring-2 ring-ring',
        resolved && 'opacity-90',
      )}
    >
      <header className="flex flex-wrap items-center gap-2 px-3 py-2">
        <Button
          variant="ghost"
          size="icon-xs"
          aria-expanded={expanded}
          aria-controls={detailsId}
          aria-label={expanded ? 'Hide finding details' : 'Show finding details'}
          onClick={() => {
            setExpanded((value) => !value)
          }}
        >
          {expanded ? <ChevronDown /> : <ChevronRight />}
        </Button>
        <SeverityBadge severity={finding.severity} />
        <h3 className="min-w-0 flex-1 font-semibold">{finding.title}</h3>
        {resolved && (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground">
            <CircleCheck className="size-3.5" aria-hidden="true" />
            Resolved
          </span>
        )}
        <code className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
          {finding.ruleId}
        </code>
        {actions}
      </header>
      {/* Collapsed details stay mounted (hidden) so an unsent reply draft survives resolving. */}
      <div id={detailsId} hidden={!expanded} className="space-y-3 border-t px-3 py-3">
        <dl className="space-y-2">
          <Section label="Evidence">{finding.evidence}</Section>
          <Section label="Impact">{finding.impact}</Section>
          <Section label="Recommendation">{finding.recommendation}</Section>
        </dl>
        <p className="text-xs text-muted-foreground">
          Confidence {Math.round(finding.confidence * 100)}%{' '}
          <span>(model estimate, not proof)</span>
        </p>
        <div className="flex flex-wrap items-center gap-1 text-xs">
          <span className="text-muted-foreground">Related changed lines:</span>
          {finding.relatedChangedLines.map((anchor) => (
            <Button
              key={`${anchor.path}:${anchor.side}:${String(anchor.line)}`}
              variant="link"
              size="xs"
              className="h-auto px-1 font-mono"
              onClick={() => onRelatedLineClick?.(anchor)}
            >
              {anchor.path}:{anchor.side === 'LEFT' ? 'L' : 'R'}
              {anchor.line}
            </Button>
          ))}
        </div>
        <ReplyThread replies={finding.replies} />
        {footer}
      </div>
    </article>
  )
}

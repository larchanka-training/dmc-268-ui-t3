import { ChevronDown, ChevronUp } from 'lucide-react'
import { anchorBelongsToFile, filePath, useDiffViewActions, type DiffFile } from '@/entities/diff'
import {
  countBySeverity,
  SEVERITIES,
  SeverityBadge,
  useFindingNavActions,
  useSelectedFindingId,
  type Finding,
} from '@/entities/finding'
import {
  CoverageBadge,
  PublicationBadge,
  RunStatusBadge,
  type ReviewRun,
} from '@/entities/review-run'
import { Button } from '@/shared/ui/button'
import { orderFindings } from '../lib/order-findings'

interface ReviewSummaryProps {
  run: ReviewRun
  files: DiffFile[]
  findings: Finding[]
}

const COVERAGE_NOTE = {
  complete: null,
  partial:
    'Part of this change was not reviewed, so missing findings do not mean the code is fine.',
  failed: 'The reviewer could not analyze this change. No conclusions can be drawn from it.',
} as const

export function ReviewSummary({ run, files, findings }: ReviewSummaryProps) {
  const selectedId = useSelectedFindingId()
  const { selectFinding } = useFindingNavActions()
  const { setFileCollapsed } = useDiffViewActions()
  const counts = countBySeverity(findings)
  const resolved = findings.filter((finding) => finding.status === 'resolved').length
  const ordered = orderFindings(files, findings)
  const position = ordered.findIndex((finding) => finding.id === selectedId)
  const coverageNote = COVERAGE_NOTE[run.coverage.status]

  const goTo = (index: number) => {
    const target = ordered.at(index)
    if (!target) return
    const file = files.find((item) => anchorBelongsToFile(item, target.anchor))
    if (file) setFileCollapsed(filePath(file), false)
    selectFinding(target.id)
  }

  return (
    <section aria-label="Review summary" className="space-y-3 rounded-md border bg-card p-4">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h1 className="text-lg font-semibold">{run.title}</h1>
        <span className="text-sm text-muted-foreground">
          {run.repository} #{run.pullRequest} · <code>{run.headSha.slice(0, 7)}</code>
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        <RunStatusBadge status={run.status} />
        <CoverageBadge status={run.coverage.status} />
        <PublicationBadge status={run.publication.status} />
      </div>
      {coverageNote && (
        <div
          role="note"
          className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm"
        >
          <p className="font-medium">{coverageNote}</p>
          {run.coverage.limitations.length > 0 && (
            <ul aria-label="Coverage limitations" className="mt-1 list-disc pl-5">
              {run.coverage.limitations.map((limitation) => (
                <li key={limitation}>{limitation}</li>
              ))}
            </ul>
          )}
        </div>
      )}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
        <ul aria-label="Findings by severity" className="flex flex-wrap gap-2">
          {SEVERITIES.map((severity) => (
            <li key={severity} className="flex items-center gap-1">
              <SeverityBadge severity={severity} />
              <span>{counts[severity]}</span>
            </li>
          ))}
        </ul>
        <p>
          <span>{findings.length - resolved} unresolved</span> · <span>{resolved} resolved</span>
        </p>
        <div className="ml-auto flex items-center gap-1">
          <span className="text-muted-foreground" aria-live="polite">
            {position === -1
              ? `${String(ordered.length)} findings`
              : `Finding ${String(position + 1)} of ${String(ordered.length)}`}
          </span>
          <Button
            variant="outline"
            size="icon-sm"
            aria-label="Previous finding"
            disabled={ordered.length === 0 || position === 0}
            onClick={() => {
              goTo(position === -1 ? ordered.length - 1 : position - 1)
            }}
          >
            <ChevronUp />
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            aria-label="Next finding"
            disabled={ordered.length === 0 || position === ordered.length - 1}
            onClick={() => {
              goTo(position + 1)
            }}
          >
            <ChevronDown />
          </Button>
        </div>
      </div>
    </section>
  )
}

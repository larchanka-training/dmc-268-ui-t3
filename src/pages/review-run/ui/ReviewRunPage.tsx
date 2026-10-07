import { useEffect } from 'react'
import { useDiffViewActions, useRunDiff } from '@/entities/diff'
import { useFindingNavActions, useFindings } from '@/entities/finding'
import { useReviewRun, type ReviewRun } from '@/entities/review-run'
import { Button } from '@/shared/ui/button'
import { DiffViewer } from '@/widgets/diff-viewer'
import { ReviewSummary } from '@/widgets/review-summary'
import { describeError } from '../lib/describe-error'

const IN_PROGRESS = new Set<ReviewRun['status']>(['NEW', 'QUEUED', 'RUNNING'])

function RunStateNotice({ run, findingCount }: { run: ReviewRun; findingCount: number }) {
  if (IN_PROGRESS.has(run.status)) {
    return <p role="status">The review is still in progress. Findings may be incomplete.</p>
  }
  if (run.status === 'CANCELLED') {
    return <p role="status">The review was cancelled before it finished.</p>
  }
  if (run.status === 'COMPLETED' && run.coverage.status === 'complete' && findingCount === 0) {
    return (
      <p role="status" className="rounded-md border p-4 text-sm">
        No issues found. The whole change was reviewed against the enabled rules.
      </p>
    )
  }
  return null
}

export function ReviewRunPage({ runId }: { runId: string }) {
  const run = useReviewRun(runId)
  const diff = useRunDiff(runId)
  const findings = useFindings(runId)
  const { syncRun } = useDiffViewActions()
  const { reset: resetFindingNav } = useFindingNavActions()

  useEffect(() => {
    syncRun(runId)
    resetFindingNav()
  }, [runId, syncRun, resetFindingNav])

  const queries = [run, diff, findings]
  const failed = queries.find((query) => query.isError)
  if (failed) {
    return (
      <div role="alert" className="space-y-3 rounded-md border border-destructive/40 p-4">
        <p className="font-medium">The review could not be loaded.</p>
        <p className="text-sm text-muted-foreground">{describeError(failed.error)}</p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            for (const query of queries) if (query.isError) void query.refetch()
          }}
        >
          Retry
        </Button>
      </div>
    )
  }
  if (!run.data || !diff.data || !findings.data) {
    return (
      <p role="status" aria-busy="true" className="p-4 text-sm text-muted-foreground">
        Loading review…
      </p>
    )
  }

  return (
    <div className="space-y-4">
      <ReviewSummary run={run.data} files={diff.data} findings={findings.data} />
      <RunStateNotice run={run.data} findingCount={findings.data.length} />
      <DiffViewer runId={runId} files={diff.data} findings={findings.data} />
    </div>
  )
}

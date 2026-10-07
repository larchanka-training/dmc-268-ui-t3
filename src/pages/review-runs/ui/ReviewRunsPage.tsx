import { Link } from '@tanstack/react-router'
import {
  CoverageBadge,
  RunStatusBadge,
  sortRunsNewestFirst,
  useReviewRuns,
  type ReviewRun,
} from '@/entities/review-run'
import { Button } from '@/shared/ui/button'
import { describeListError } from '../lib/describe-error'

const timeFormat = new Intl.DateTimeFormat('en', {
  dateStyle: 'medium',
  timeStyle: 'short',
  timeZone: 'UTC',
})

function RunEntry({ run }: { run: ReviewRun }) {
  return (
    <li>
      <Link
        to="/runs/$runId"
        params={{ runId: run.id }}
        className="block space-y-2 rounded-md border p-4 hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
      >
        <span className="block font-medium">{run.title}</span>
        <span className="block text-sm text-muted-foreground">
          {run.repository}#{run.pullRequest} ·{' '}
          <time dateTime={run.createdAt}>{timeFormat.format(new Date(run.createdAt))} UTC</time>
        </span>
        <span className="flex flex-wrap gap-2">
          <RunStatusBadge status={run.status} />
          <CoverageBadge status={run.coverage.status} />
        </span>
      </Link>
    </li>
  )
}

export function ReviewRunsPage() {
  const runs = useReviewRuns()

  let body
  if (runs.isError) {
    body = (
      <div role="alert" className="space-y-3 rounded-md border border-destructive/40 p-4">
        <p className="font-medium">The review runs could not be loaded.</p>
        <p className="text-sm text-muted-foreground">{describeListError(runs.error)}</p>
        <Button variant="outline" size="sm" onClick={() => void runs.refetch()}>
          Retry
        </Button>
      </div>
    )
  } else if (!runs.data) {
    body = (
      <p role="status" aria-busy="true" className="text-sm text-muted-foreground">
        Loading review runs…
      </p>
    )
  } else if (runs.data.length === 0) {
    body = (
      <p className="rounded-md border p-4 text-sm">
        No review runs yet. Runs appear here once the bot reviews a pull request.
      </p>
    )
  } else {
    body = (
      <ul aria-label="Review runs" className="space-y-3">
        {sortRunsNewestFirst(runs.data).map((run) => (
          <RunEntry key={run.id} run={run} />
        ))}
      </ul>
    )
  }

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold">Review runs</h1>
      {body}
    </div>
  )
}

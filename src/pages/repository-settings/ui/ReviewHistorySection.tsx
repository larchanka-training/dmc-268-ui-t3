import { Link } from '@tanstack/react-router'
import {
  CoverageBadge,
  RunStatusBadge,
  runsOfRepository,
  sortRunsNewestFirst,
  useReviewRuns,
  type ReviewRun,
} from '@/entities/review-run'
import { describeLoadError } from '../lib/describe-error'
import { ErrorState, LoadingState, Section } from './states'

const timeFormat = new Intl.DateTimeFormat('en', {
  dateStyle: 'medium',
  timeStyle: 'short',
  timeZone: 'UTC',
})

function HistoryEntry({ run }: { run: ReviewRun }) {
  return (
    <li>
      <Link
        to="/runs/$runId"
        params={{ runId: run.id }}
        className="block space-y-2 rounded-md border p-3 hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
      >
        <span className="block font-medium">{run.title}</span>
        <span className="block text-sm text-muted-foreground">
          Pull request #{run.pullRequest} ·{' '}
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

/** Review runs of one repository, newest first; filtered from the user's run list. */
export function ReviewHistorySection({ fullName }: { fullName: string }) {
  const runs = useReviewRuns()

  let body
  if (runs.isError) {
    body = (
      <ErrorState
        title="The review history could not be loaded."
        detail={describeLoadError(runs.error, 'the review runs')}
        onRetry={() => void runs.refetch()}
      />
    )
  } else if (!runs.data) {
    body = <LoadingState>Loading review history…</LoadingState>
  } else {
    const own = sortRunsNewestFirst(runsOfRepository(runs.data, fullName))
    body =
      own.length === 0 ? (
        <p className="rounded-md border p-4 text-sm">No reviews have run on this repository yet.</p>
      ) : (
        <ul aria-label="Review runs of this repository" className="space-y-2">
          {own.map((run) => (
            <HistoryEntry key={run.id} run={run} />
          ))}
        </ul>
      )
  }

  return (
    <Section id="repository-review-history" title="Review history">
      {body}
    </Section>
  )
}

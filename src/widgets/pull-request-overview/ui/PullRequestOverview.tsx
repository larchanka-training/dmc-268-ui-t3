import { ExternalLink, GitPullRequest } from 'lucide-react'
import { countByGroup, countBySeverity, type Finding } from '@/entities/finding'
import {
  CoverageBadge,
  PublicationBadge,
  RunStatusBadge,
  type PullRequestAuthor,
  type ReviewRun,
} from '@/entities/review-run'
import { cn } from '@/shared/lib/cn'
import { deriveScore, deriveVerdict, VERDICT_LABEL, type Verdict } from '../lib/verdict'

interface PullRequestOverviewProps {
  run: ReviewRun
  findings: Finding[]
}

const VERDICT_STYLE: Record<Verdict, string> = {
  in_progress: 'bg-muted text-muted-foreground',
  no_verdict: 'bg-muted text-muted-foreground',
  changes_requested: 'bg-severity-critical-bg text-severity-critical',
  needs_attention: 'bg-severity-warning-bg text-severity-warning',
  partially_reviewed: 'bg-severity-warning-bg text-severity-warning',
  no_blocking_issues: 'bg-diff-add text-diff-add-foreground',
}

const VERDICT_NOTE: Partial<Record<Verdict, string>> = {
  in_progress: 'Findings may still change while the review runs.',
  no_verdict: 'The change was not reviewed, so no conclusion can be drawn.',
  partially_reviewed:
    'Part of the change was not reviewed, so the absence of serious findings is not a pass.',
}

function AuthorAvatar({ author }: { author: PullRequestAuthor }) {
  if (author.avatarUrl) {
    return <img src={author.avatarUrl} alt={author.login} className="size-6 rounded-full border" />
  }
  return (
    <span
      aria-hidden="true"
      data-testid="avatar-fallback"
      className="flex size-6 items-center justify-center rounded-full border bg-muted text-xs font-semibold"
    >
      {author.login.charAt(0).toUpperCase()}
    </span>
  )
}

function Branches({ base, head }: { base: string; head: string }) {
  return (
    <span className="inline-flex items-center gap-1">
      <span aria-hidden="true" className="inline-flex items-center gap-1">
        <code className="rounded bg-muted px-1.5 py-0.5 text-xs">{base}</code>
        <span>←</span>
        <code className="rounded bg-muted px-1.5 py-0.5 text-xs">{head}</code>
      </span>
      <span className="sr-only">
        Merges {head} into {base}
      </span>
    </span>
  )
}

function VerdictPanel({ run, findings }: PullRequestOverviewProps) {
  const verdict = deriveVerdict({
    runStatus: run.status,
    coverageStatus: run.coverage.status,
    groupCounts: countByGroup(findings),
  })
  const score = deriveScore({
    runStatus: run.status,
    coverageStatus: run.coverage.status,
    levelCounts: countBySeverity(findings),
  })
  const note = VERDICT_NOTE[verdict]
  const showPartialScoreNote = run.status === 'COMPLETED' && run.coverage.status === 'partial'

  return (
    <div aria-label="Review verdict" role="group" className="flex flex-wrap items-start gap-4">
      <div className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Verdict
        </p>
        <p
          data-verdict={verdict}
          className={cn(
            'inline-flex rounded px-2 py-1 text-sm font-semibold',
            VERDICT_STYLE[verdict],
          )}
        >
          {VERDICT_LABEL[verdict]}
        </p>
        {note && <p className="max-w-prose text-xs text-muted-foreground">{note}</p>}
      </div>
      {score !== null && (
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Score
          </p>
          <p className="text-sm">
            <span className="text-lg font-semibold tabular-nums">{score}</span> out of 100
          </p>
          <p className="text-xs text-muted-foreground">Heuristic, not a quality guarantee.</p>
        </div>
      )}
      {showPartialScoreNote && (
        <p className="self-end text-xs text-muted-foreground">
          Score unavailable because coverage is partial.
        </p>
      )}
    </div>
  )
}

/** Pull request identity, metadata, review status, and the derived overall verdict. */
export function PullRequestOverview({ run, findings }: PullRequestOverviewProps) {
  return (
    <section aria-label="Pull request" className="space-y-3 rounded-md border bg-card p-4">
      <div className="space-y-1">
        <h1 className="text-lg font-semibold">{run.title}</h1>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <GitPullRequest className="size-4" aria-hidden="true" />
            {run.repository} #{run.pullRequest}
          </span>
          <code title={run.headSha}>{run.headSha.slice(0, 7)}</code>
          {run.author && (
            <span className="inline-flex items-center gap-1.5">
              <AuthorAvatar author={run.author} />
              <span>{run.author.login}</span>
            </span>
          )}
          {run.baseBranch && run.headBranch && (
            <Branches base={run.baseBranch} head={run.headBranch} />
          )}
          {run.pullRequestUrl && (
            <a
              href={run.pullRequestUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-foreground underline-offset-4 hover:underline"
            >
              View pull request
              <ExternalLink className="size-3.5" aria-hidden="true" />
              <span className="sr-only">(opens in a new tab)</span>
            </a>
          )}
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <RunStatusBadge status={run.status} />
        <CoverageBadge status={run.coverage.status} />
        <PublicationBadge status={run.publication.status} />
      </div>
      <VerdictPanel run={run} findings={findings} />
    </section>
  )
}

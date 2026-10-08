import { ExternalLinkIcon, TriangleAlertIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { PROVIDER_LABEL, type Repository } from '@/entities/repository'
import {
  RuleList,
  RulesStatusBadge,
  useRepositoryRules,
  type RepositoryRules,
} from '@/entities/review-rules'
import { describeLoadError } from '../lib/describe-error'
import { ErrorState, LoadingState, Section } from './states'

function Warning({ children }: { children: ReactNode }) {
  return (
    <div
      role="note"
      className="flex gap-3 rounded-md bg-severity-warning-bg p-4 text-sm text-severity-warning"
    >
      <TriangleAlertIcon aria-hidden className="mt-0.5 size-4 shrink-0" />
      <div className="space-y-2">{children}</div>
    </div>
  )
}

function SourceDetails({ rules, repository }: { rules: RepositoryRules; repository: Repository }) {
  return (
    <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
      <dt className="text-muted-foreground">Branch</dt>
      <dd>
        <code>{rules.branch}</code>
      </dd>
      {rules.commitSha && (
        <>
          <dt className="text-muted-foreground">Commit</dt>
          <dd>
            <code title={rules.commitSha}>{rules.commitSha.slice(0, 7)}</code>
          </dd>
        </>
      )}
      <dt className="text-muted-foreground">Rules version</dt>
      <dd>
        <code>{rules.rulesVersion}</code>
      </dd>
      {rules.fileUrl && (
        <>
          <dt className="sr-only">File</dt>
          <dd className="col-span-2">
            <a
              href={rules.fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-medium underline underline-offset-4"
            >
              Open {rules.path} on {PROVIDER_LABEL[repository.provider]}
              <ExternalLinkIcon aria-hidden className="size-3.5" />
            </a>
          </dd>
        </>
      )}
    </dl>
  )
}

function StatusWarning({ rules }: { rules: RepositoryRules }) {
  if (rules.status === 'missing') {
    return (
      <Warning>
        <p className="font-medium">
          Default rules are being used; create <code>{rules.path}</code>
        </p>
        <p>
          No <code>{rules.path}</code> was found on <code>{rules.branch}</code>.
        </p>
      </Warning>
    )
  }
  if (rules.status === 'invalid') {
    return (
      <Warning>
        <p className="font-medium">
          <code>{rules.path}</code> on <code>{rules.branch}</code> could not be read, so the default
          rules are being used.
        </p>
        <ul aria-label="Problems in the rules file" className="list-disc space-y-1 pl-4">
          {rules.problems.map((problem, index) => (
            <li key={index}>
              {problem.line !== null && `Line ${String(problem.line)}: `}
              {problem.message}
            </li>
          ))}
        </ul>
      </Warning>
    )
  }
  return null
}

export function RulesSection({ repository }: { repository: Repository }) {
  const rules = useRepositoryRules(repository.id)

  let body
  if (rules.isError) {
    body = (
      <ErrorState
        title="The rules could not be loaded."
        detail={describeLoadError(rules.error, 'the rules')}
        onRetry={() => void rules.refetch()}
      />
    )
  } else if (!rules.data) {
    body = <LoadingState>Loading rules…</LoadingState>
  } else {
    const { data } = rules
    body = (
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="sr-only">Rules file status:</span>
          <RulesStatusBadge status={data.status} />
        </div>
        <SourceDetails rules={data} repository={repository} />
        <StatusWarning rules={data} />
        <div className="space-y-2">
          <h3 className="text-sm font-medium">
            {data.status === 'custom' ? 'Rules in effect' : 'Default rules in effect'}
          </h3>
          {data.rules.length === 0 ? (
            <p className="rounded-md border p-4 text-sm">
              No rules are enabled, so the reviewer reports no findings.
            </p>
          ) : (
            <RuleList rules={data.rules} label="Rules in effect" />
          )}
        </div>
      </div>
    )
  }

  return (
    <Section
      id="repository-rules"
      title="Rules"
      description="The rules the reviewer applies, read from .review/rules.md on the default branch. Read-only."
    >
      {body}
    </Section>
  )
}

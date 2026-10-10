import { Link } from '@tanstack/react-router'
import { ExternalLinkIcon, GitBranchIcon, PlusIcon } from 'lucide-react'
import {
  PROVIDER_LABEL,
  ProviderBadge,
  sortByFullName,
  useRepositories,
  VisibilityBadge,
  type Repository,
} from '@/entities/repository'
import { Button } from '@/shared/ui/button'
import { describeListError } from '../lib/describe-error'

const timeFormat = new Intl.DateTimeFormat('en', {
  dateStyle: 'medium',
  timeStyle: 'short',
  timeZone: 'UTC',
})

function ConnectLink() {
  return (
    <Button asChild size="sm">
      <Link to="/repositories/connect">
        <PlusIcon aria-hidden />
        Connect repository
      </Link>
    </Button>
  )
}

function RepositoryEntry({ repository }: { repository: Repository }) {
  const provider = PROVIDER_LABEL[repository.provider]
  return (
    <li className="flex items-start justify-between gap-3 rounded-md border p-4">
      <div className="min-w-0 space-y-2">
        <span className="block truncate font-medium">{repository.fullName}</span>
        <span className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <ProviderBadge provider={repository.provider} />
          <VisibilityBadge isPrivate={repository.isPrivate} />
          <span className="inline-flex items-center gap-1">
            <GitBranchIcon aria-hidden className="size-3.5" />
            <span className="sr-only">Default branch:</span>
            {repository.defaultBranch}
          </span>
          <span>
            Connected{' '}
            <time dateTime={repository.connectedAt}>
              {timeFormat.format(new Date(repository.connectedAt))} UTC
            </time>
          </span>
        </span>
      </div>
      <Button asChild variant="ghost" size="icon">
        <a
          href={repository.url}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Open ${repository.fullName} on ${provider}`}
        >
          <ExternalLinkIcon aria-hidden />
        </a>
      </Button>
    </li>
  )
}

export function RepositoriesPage() {
  const repositories = useRepositories()
  const hasEntries = Boolean(repositories.data && repositories.data.length > 0)

  let body
  if (repositories.isError) {
    body = (
      <div role="alert" className="space-y-3 rounded-md border border-destructive/40 p-4">
        <p className="font-medium">The repositories could not be loaded.</p>
        <p className="text-sm text-muted-foreground">{describeListError(repositories.error)}</p>
        <Button variant="outline" size="sm" onClick={() => void repositories.refetch()}>
          Retry
        </Button>
      </div>
    )
  } else if (!repositories.data) {
    body = (
      <p role="status" aria-busy="true" className="text-sm text-muted-foreground">
        Loading repositories…
      </p>
    )
  } else if (!hasEntries) {
    body = (
      <div className="space-y-3 rounded-md border p-4">
        <p className="text-sm">
          No repositories connected yet. Connect one so the reviewer can check its pull requests.
        </p>
        <ConnectLink />
      </div>
    )
  } else {
    body = (
      <ul aria-label="Connected repositories" className="space-y-3">
        {sortByFullName(repositories.data).map((repository) => (
          <RepositoryEntry key={repository.id} repository={repository} />
        ))}
      </ul>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-lg font-semibold">Repositories</h1>
        {hasEntries && !repositories.isError && <ConnectLink />}
      </div>
      {body}
    </div>
  )
}

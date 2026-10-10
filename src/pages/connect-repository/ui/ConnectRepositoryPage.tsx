import { Link } from '@tanstack/react-router'
import { ArrowLeftIcon, CheckIcon, ExternalLinkIcon } from 'lucide-react'
import { useId, useState } from 'react'
import {
  ProviderBadge,
  sortByFullName,
  useAvailableRepositories,
  VisibilityBadge,
  type AvailableRepository,
} from '@/entities/repository'
import { ConnectRepositoryButton } from '@/features/connect-repository'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { describeListError } from '../lib/describe-error'
import { filterByFullName } from '../lib/filter'

interface ConnectRepositoryPageProps {
  /** GitHub App installation page; null hides the installation hint. */
  githubAppInstallUrl: string | null
  /** Called once a repository is connected and the repository lists are fresh. */
  onConnected: () => void
}

function AvailableEntry({
  repository,
  onConnected,
}: {
  repository: AvailableRepository
  onConnected: () => void
}) {
  return (
    <li className="flex items-start justify-between gap-3 rounded-md border p-4">
      <div className="min-w-0 space-y-2">
        <span className="block truncate font-medium">{repository.fullName}</span>
        <span className="flex flex-wrap gap-2">
          <ProviderBadge provider={repository.provider} />
          <VisibilityBadge isPrivate={repository.isPrivate} />
        </span>
      </div>
      {repository.isConnected ? (
        <Badge variant="outline" className="h-8">
          <CheckIcon aria-hidden />
          Connected
        </Badge>
      ) : (
        <ConnectRepositoryButton repository={repository} onConnected={onConnected} />
      )}
    </li>
  )
}

function InstallHint({ url }: { url: string }) {
  return (
    <p className="text-sm text-muted-foreground">
      Don&apos;t see a repository?{' '}
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 font-medium text-foreground underline underline-offset-4"
      >
        Install the GitHub App on more repositories
        <ExternalLinkIcon aria-hidden className="size-3.5" />
      </a>
    </p>
  )
}

export function ConnectRepositoryPage({
  githubAppInstallUrl,
  onConnected,
}: ConnectRepositoryPageProps) {
  const repositories = useAvailableRepositories()
  const [query, setQuery] = useState('')
  const filterId = useId()

  let body
  if (repositories.isError) {
    body = (
      <div role="alert" className="space-y-3 rounded-md border border-destructive/40 p-4">
        <p className="font-medium">The repositories you can access could not be loaded.</p>
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
  } else if (repositories.data.length === 0) {
    body = (
      <p className="rounded-md border p-4 text-sm">
        No repositories found that the reviewer can access.
      </p>
    )
  } else {
    const visible = filterByFullName(sortByFullName(repositories.data), query)
    body = (
      <div className="space-y-3">
        <div className="space-y-1">
          <label htmlFor={filterId} className="text-sm font-medium">
            Filter repositories
          </label>
          <Input
            id={filterId}
            type="search"
            placeholder="owner/name"
            autoComplete="off"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value)
            }}
          />
        </div>
        {visible.length === 0 ? (
          <p role="status" className="rounded-md border p-4 text-sm">
            No repositories match &ldquo;{query.trim()}&rdquo;.
          </p>
        ) : (
          <ul aria-label="Accessible repositories" className="space-y-3">
            {visible.map((repository) => (
              <AvailableEntry
                key={`${repository.provider}:${repository.externalId}`}
                repository={repository}
                onConnected={onConnected}
              />
            ))}
          </ul>
        )}
      </div>
    )
  }

  return (
    <div className="max-w-3xl space-y-4">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link to="/repositories">
          <ArrowLeftIcon aria-hidden />
          Repositories
        </Link>
      </Button>
      <div className="space-y-1">
        <h1 className="text-lg font-semibold">Connect repository</h1>
        <p className="text-sm text-muted-foreground">
          Choose a repository for the reviewer to check pull requests in.
        </p>
      </div>
      {githubAppInstallUrl && <InstallHint url={githubAppInstallUrl} />}
      {body}
    </div>
  )
}

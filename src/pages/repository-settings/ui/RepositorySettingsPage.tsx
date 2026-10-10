import { Link } from '@tanstack/react-router'
import { ArrowLeftIcon, ExternalLinkIcon, GitBranchIcon } from 'lucide-react'
import {
  PROVIDER_LABEL,
  ProviderBadge,
  useRepository,
  VisibilityBadge,
  type Repository,
} from '@/entities/repository'
import { Button } from '@/shared/ui/button'
import { describeLoadError, isNotFound } from '../lib/describe-error'
import { ReviewHistorySection } from './ReviewHistorySection'
import { ReviewSettingsSection } from './ReviewSettingsSection'
import { RulesSection } from './RulesSection'
import { ErrorState, LoadingState } from './states'

function BackLink() {
  return (
    <Link
      to="/repositories"
      className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
    >
      <ArrowLeftIcon aria-hidden className="size-4" />
      Repositories
    </Link>
  )
}

function Header({ repository }: { repository: Repository }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0 space-y-2">
        <h1 className="text-lg font-semibold break-words">{repository.fullName}</h1>
        <span className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <ProviderBadge provider={repository.provider} />
          <VisibilityBadge isPrivate={repository.isPrivate} />
          <span className="inline-flex items-center gap-1">
            <GitBranchIcon aria-hidden className="size-3.5" />
            <span className="sr-only">Default branch:</span>
            {repository.defaultBranch}
          </span>
        </span>
      </div>
      <Button asChild variant="ghost" size="icon">
        <a
          href={repository.url}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Open ${repository.fullName} on ${PROVIDER_LABEL[repository.provider]}`}
        >
          <ExternalLinkIcon aria-hidden />
        </a>
      </Button>
    </div>
  )
}

export function RepositorySettingsPage({ repositoryId }: { repositoryId: string }) {
  const repository = useRepository(repositoryId)

  let body
  if (repository.isError && isNotFound(repository.error)) {
    body = (
      <>
        <h1 className="text-lg font-semibold">Repository not found</h1>
        <p className="rounded-md border p-4 text-sm">
          This repository does not exist or is not connected to the reviewer.{' '}
          <Link to="/repositories" className="font-medium underline underline-offset-4">
            Go to Repositories
          </Link>
        </p>
      </>
    )
  } else if (repository.isError) {
    body = (
      <>
        <h1 className="text-lg font-semibold">Repository settings</h1>
        <ErrorState
          title="The repository could not be loaded."
          detail={describeLoadError(repository.error, 'the repository')}
          onRetry={() => void repository.refetch()}
        />
      </>
    )
  } else if (!repository.data) {
    body = (
      <>
        <h1 className="text-lg font-semibold">Repository settings</h1>
        <LoadingState>Loading repository…</LoadingState>
      </>
    )
  } else {
    const { data } = repository
    body = (
      <>
        <Header repository={data} />
        <ReviewSettingsSection repositoryId={data.id} />
        <RulesSection repository={data} />
        <ReviewHistorySection fullName={data.fullName} />
      </>
    )
  }

  return (
    <div className="max-w-3xl space-y-4">
      <BackLink />
      {body}
    </div>
  )
}

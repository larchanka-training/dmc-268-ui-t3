import { useReviewSettings } from '@/entities/review-settings'
import { ReviewSettingsForm } from '@/features/update-review-settings'
import { describeLoadError } from '../lib/describe-error'
import { ErrorState, LoadingState, Section } from './states'

export function ReviewSettingsSection({ repositoryId }: { repositoryId: string }) {
  const settings = useReviewSettings(repositoryId)

  let body
  if (settings.isError) {
    body = (
      <ErrorState
        title="The review settings could not be loaded."
        detail={describeLoadError(settings.error, 'the review settings')}
        onRetry={() => void settings.refetch()}
      />
    )
  } else if (!settings.data) {
    body = <LoadingState>Loading review settings…</LoadingState>
  } else {
    body = (
      <ReviewSettingsForm key={repositoryId} repositoryId={repositoryId} settings={settings.data} />
    )
  }

  return (
    <Section
      id="repository-review-settings"
      title="Review settings"
      description="How the reviewer handles pull requests in this repository."
    >
      {body}
    </Section>
  )
}

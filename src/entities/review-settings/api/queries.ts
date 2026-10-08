import { useQuery } from '@tanstack/react-query'
import { useReviewApi } from '@/shared/api'
import { reviewSettingsSchema } from '../model/schema'

export const reviewSettingsKeys = {
  /** Under the repository's key, so repository invalidation and sign-out cover it. */
  detail: (repositoryId: string) => ['repositories', 'byId', repositoryId, 'settings'] as const,
}

/** The review settings of one connected repository. */
export function useReviewSettings(repositoryId: string) {
  const api = useReviewApi()
  return useQuery({
    queryKey: reviewSettingsKeys.detail(repositoryId),
    queryFn: async ({ signal }) =>
      reviewSettingsSchema.parse(await api.getReviewSettings(repositoryId, signal)),
  })
}

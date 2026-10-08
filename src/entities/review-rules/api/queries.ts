import { useQuery } from '@tanstack/react-query'
import { useReviewApi } from '@/shared/api'
import { repositoryRulesSchema } from '../model/schema'

export const repositoryRulesKeys = {
  /** Under the repository's key, so repository invalidation and sign-out cover it. */
  detail: (repositoryId: string) => ['repositories', 'byId', repositoryId, 'rules'] as const,
}

/** The rules in effect for one connected repository, and where they came from. */
export function useRepositoryRules(repositoryId: string) {
  const api = useReviewApi()
  return useQuery({
    queryKey: repositoryRulesKeys.detail(repositoryId),
    queryFn: async ({ signal }) =>
      repositoryRulesSchema.parse(await api.getRepositoryRules(repositoryId, signal)),
  })
}

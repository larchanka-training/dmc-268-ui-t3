import { useQuery } from '@tanstack/react-query'
import { useReviewApi } from '@/shared/api'
import { findingListSchema } from '../model/schema'

export const findingKeys = {
  list: (runId: string) => ['run', runId, 'findings'] as const,
}

export function useFindings(runId: string) {
  const api = useReviewApi()
  return useQuery({
    queryKey: findingKeys.list(runId),
    queryFn: async ({ signal }) => findingListSchema.parse(await api.getFindings(runId, signal)),
  })
}

import { useQuery } from '@tanstack/react-query'
import { useReviewApi } from '@/shared/api'
import { reviewRunListSchema, reviewRunSchema } from '../model/schema'

export const reviewRunKeys = {
  all: ['run'] as const,
  detail: (runId: string) => ['run', runId] as const,
  /** Not under ['run', runId]: the list is not data of a single run. */
  list: ['runs'] as const,
}

export function useReviewRun(runId: string) {
  const api = useReviewApi()
  return useQuery({
    queryKey: reviewRunKeys.detail(runId),
    queryFn: async ({ signal }) => reviewRunSchema.parse(await api.getRun(runId, signal)),
  })
}

export function useReviewRuns() {
  const api = useReviewApi()
  return useQuery({
    queryKey: reviewRunKeys.list,
    queryFn: async ({ signal }) => reviewRunListSchema.parse(await api.listRuns(signal)),
  })
}

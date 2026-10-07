import { useQuery } from '@tanstack/react-query'
import { useReviewApi } from '@/shared/api'
import { reviewRunSchema } from '../model/schema'

export const reviewRunKeys = {
  all: ['run'] as const,
  detail: (runId: string) => ['run', runId] as const,
}

export function useReviewRun(runId: string) {
  const api = useReviewApi()
  return useQuery({
    queryKey: reviewRunKeys.detail(runId),
    queryFn: async ({ signal }) => reviewRunSchema.parse(await api.getRun(runId, signal)),
  })
}

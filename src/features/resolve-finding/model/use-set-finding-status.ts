import { useMutation, useQueryClient } from '@tanstack/react-query'
import { findingKeys, findingSchema, type Finding, type FindingStatus } from '@/entities/finding'
import { useReviewApi } from '@/shared/api'

interface StatusInput {
  findingId: string
  status: FindingStatus
}

/** Optimistically changes a finding's status and rolls back if the server rejects it. */
export function useSetFindingStatus(runId: string) {
  const api = useReviewApi()
  const queryClient = useQueryClient()
  const key = findingKeys.list(runId)
  return useMutation({
    mutationFn: async ({ findingId, status }: StatusInput) =>
      findingSchema.parse(await api.setFindingStatus({ runId, findingId, status })),
    onMutate: async ({ findingId, status }) => {
      await queryClient.cancelQueries({ queryKey: key })
      const previous = queryClient.getQueryData<Finding[]>(key)
      queryClient.setQueryData<Finding[]>(key, (findings) =>
        findings?.map((finding) => (finding.id === findingId ? { ...finding, status } : finding)),
      )
      return { previous }
    },
    onError: (_error, _input, context) => {
      if (context?.previous) queryClient.setQueryData(key, context.previous)
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: key }),
  })
}

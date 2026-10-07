import { useMutation, useQueryClient } from '@tanstack/react-query'
import { repositoryKeys, repositorySchema, type AvailableRepository } from '@/entities/repository'
import { ApiError, useReviewApi } from '@/shared/api'

/**
 * Connects a repository. Not optimistic: the server assigns its ID and
 * connection time. "Already connected" (409) counts as success. Both repository
 * lists are refetched before `onConnected` runs, so the connected list never
 * renders from a cache that lacks the new entry.
 */
export function useConnectRepository(onConnected: () => void) {
  const api = useReviewApi()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ provider, externalId }: AvailableRepository) => {
      try {
        repositorySchema.parse(await api.connectRepository({ provider, externalId }))
      } catch (error) {
        if (error instanceof ApiError && error.status === 409) return
        throw error
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: repositoryKeys.all, refetchType: 'all' })
      onConnected()
    },
  })
}

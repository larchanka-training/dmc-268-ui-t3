import { useQuery } from '@tanstack/react-query'
import { useReviewApi } from '@/shared/api'
import {
  availableRepositoryListSchema,
  repositoryListSchema,
  repositorySchema,
} from '../model/schema'

export const repositoryKeys = {
  /** Prefix of every repository query: invalidate it after a connection. */
  all: ['repositories'] as const,
  connected: ['repositories', 'connected'] as const,
  available: ['repositories', 'available'] as const,
  /**
   * One repository and, below it, its settings and rules. The `byId` segment keeps a
   * repository ID from ever colliding with the `connected` and `available` keys.
   */
  detail: (repositoryId: string) => ['repositories', 'byId', repositoryId] as const,
}

/** The repositories connected for the signed-in user. */
export function useRepositories() {
  const api = useReviewApi()
  return useQuery({
    queryKey: repositoryKeys.connected,
    queryFn: async ({ signal }) => repositoryListSchema.parse(await api.listRepositories(signal)),
  })
}

/** The repositories the signed-in user can access and connect. */
export function useAvailableRepositories() {
  const api = useReviewApi()
  return useQuery({
    queryKey: repositoryKeys.available,
    queryFn: async ({ signal }) =>
      availableRepositoryListSchema.parse(await api.listAvailableRepositories(signal)),
  })
}

/** One connected repository; a 404 means it is unknown or not connected for the user. */
export function useRepository(repositoryId: string) {
  const api = useReviewApi()
  return useQuery({
    queryKey: repositoryKeys.detail(repositoryId),
    queryFn: async ({ signal }) =>
      repositorySchema.parse(await api.getRepository(repositoryId, signal)),
  })
}

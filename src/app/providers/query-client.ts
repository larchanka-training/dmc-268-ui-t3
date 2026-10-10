import { QueryClient } from '@tanstack/react-query'
import { ZodError } from 'zod'
import { ApiError } from '@/shared/api'

/** Retries only transient failures: never invalid payloads or 4xx responses. */
function shouldRetry(failureCount: number, error: unknown): boolean {
  if (error instanceof ZodError) return false
  if (error instanceof ApiError && error.status < 500) return false
  return failureCount < 1
}

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        retry: shouldRetry,
        refetchOnWindowFocus: false,
      },
    },
  })
}

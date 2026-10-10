import { ZodError } from 'zod'
import { ApiError } from '@/shared/api'

/** A user-facing explanation of a failed repository list request. Never includes response bodies. */
export function describeListError(error: unknown): string {
  if (error instanceof ZodError) {
    return 'The server sent the repository list in an unexpected format.'
  }
  if (error instanceof ApiError) return `The server returned an error (${String(error.status)}).`
  return 'The repository list could not be loaded.'
}

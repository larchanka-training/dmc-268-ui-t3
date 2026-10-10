import { ZodError } from 'zod'
import { ApiError } from '@/shared/api'

/** A user-facing explanation of a failed run list request. Never includes response bodies. */
export function describeListError(error: unknown): string {
  if (error instanceof ZodError) return 'The server sent the run list in an unexpected format.'
  if (error instanceof ApiError) return `The server returned an error (${String(error.status)}).`
  return 'The run list could not be loaded.'
}

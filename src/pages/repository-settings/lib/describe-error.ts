import { ZodError } from 'zod'
import { ApiError } from '@/shared/api'

/** True when the repository is unknown or not connected for the user. */
export function isNotFound(error: unknown): boolean {
  return error instanceof ApiError && error.status === 404
}

/**
 * A user-facing explanation of a failed request for `what` ("the repository", "the review
 * settings", …). Never includes response bodies.
 */
export function describeLoadError(error: unknown, what: string): string {
  if (error instanceof ZodError) return `The server sent ${what} in an unexpected format.`
  if (error instanceof ApiError) return `The server returned an error (${String(error.status)}).`
  return `${what.charAt(0).toUpperCase()}${what.slice(1)} could not be loaded.`
}

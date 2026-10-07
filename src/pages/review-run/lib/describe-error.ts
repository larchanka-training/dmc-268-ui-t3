import { ZodError } from 'zod'
import { DiffParseFailure } from '@/entities/diff'
import { ApiError } from '@/shared/api'

/** A user-facing explanation of a failed request. Never includes response bodies. */
export function describeError(error: unknown): string {
  if (error instanceof ZodError) return 'The server sent review data in an unexpected format.'
  if (error instanceof DiffParseFailure) return error.message
  if (error instanceof ApiError) {
    return error.status === 404
      ? 'This review run was not found.'
      : `The server returned an error (${String(error.status)}).`
  }
  return 'The review could not be loaded.'
}

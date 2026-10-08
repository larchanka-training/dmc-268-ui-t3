import { ApiError } from '@/shared/api'

/** A user-facing explanation of a failed save. Never includes response bodies. */
export function describeSaveError(error: unknown): string {
  if (error instanceof ApiError && error.status === 422) {
    return 'The server rejected these settings. Check the branch filter and try again.'
  }
  return 'The settings could not be saved. Try again.'
}

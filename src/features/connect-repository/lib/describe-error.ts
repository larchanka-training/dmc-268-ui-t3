import { ApiError } from '@/shared/api'

/** A user-facing explanation of a failed connection. Never includes response bodies. */
export function describeConnectError(error: unknown): string {
  if (error instanceof ApiError && (error.status === 403 || error.status === 404)) {
    return 'The reviewer cannot access this repository.'
  }
  return 'The repository could not be connected. Try again.'
}

import { ApiError } from '../review-api'

export interface AuthorizedFetchOptions {
  /** Current in-memory access token, or null when signed out. */
  getToken: () => string | null
  /** Renews the session and resolves with the new access token. */
  refresh: () => Promise<string>
  /** Called when the session cannot be recovered: a second 401, or a refresh rejected with 401. */
  onUnauthorized: () => void
  fetchImpl?: typeof fetch
}

export type AuthorizedFetch = (input: string, init?: RequestInit) => Promise<Response>

/**
 * fetch with `Authorization: Bearer`, for the HTTP ReviewApi. On a 401 it renews
 * the session once and retries once. Concurrent 401s share one refresh, and a
 * request that failed with an already replaced token retries without refreshing.
 * Request bodies must be replayable (strings, not streams).
 */
export function createAuthorizedFetch({
  getToken,
  refresh,
  onUnauthorized,
  fetchImpl = fetch,
}: AuthorizedFetchOptions): AuthorizedFetch {
  let pendingRefresh: Promise<string> | null = null

  function sharedRefresh(): Promise<string> {
    pendingRefresh ??= refresh().finally(() => {
      pendingRefresh = null
    })
    return pendingRefresh
  }

  function send(input: string, init: RequestInit | undefined, token: string | null) {
    const headers = new Headers(init?.headers)
    if (token) headers.set('Authorization', `Bearer ${token}`)
    return fetchImpl(input, { ...init, headers })
  }

  return async (input, init) => {
    const usedToken = getToken()
    const response = await send(input, init, usedToken)
    if (response.status !== 401) return response

    let nextToken: string
    const current = getToken()
    if (current !== null && current !== usedToken) {
      nextToken = current
    } else {
      try {
        nextToken = await sharedRefresh()
      } catch (error) {
        // A transient refresh failure leaves the session alone; the caller sees the error.
        if (error instanceof ApiError && error.status === 401) onUnauthorized()
        throw error
      }
    }

    const retried = await send(input, init, nextToken)
    if (retried.status === 401) onUnauthorized()
    return retried
  }
}

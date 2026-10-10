import { ApiError } from '../review-api'
import type { AuthApi } from './auth-api'

async function readError(response: Response): Promise<ApiError> {
  let message = `Request failed with status ${String(response.status)}`
  try {
    const body: unknown = await response.json()
    if (body && typeof body === 'object' && 'detail' in body && typeof body.detail === 'string') {
      message = body.detail
    }
  } catch {
    // Non-JSON error body: keep the generic message.
  }
  return new ApiError(message, response.status)
}

/**
 * AuthApi over the backend endpoints described in FRONTEND_ARCHITECTURE.md
 * (Authentication). `credentials: 'include'` lets the backend set and read the
 * httpOnly refresh cookie.
 */
export function createHttpAuthApi(baseUrl: string, fetchImpl: typeof fetch = fetch): AuthApi {
  async function post(path: string, init: RequestInit): Promise<Response> {
    const response = await fetchImpl(`${baseUrl}${path}`, {
      ...init,
      method: 'POST',
      credentials: 'include',
    })
    if (!response.ok) throw await readError(response)
    return response
  }

  return {
    exchange: async ({ code, codeVerifier, redirectUri }, signal) => {
      const response = await post('/auth/github/exchange', {
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, code_verifier: codeVerifier, redirect_uri: redirectUri }),
        signal,
      })
      return (await response.json()) as unknown
    },
    refresh: async (signal) => {
      const response = await post('/auth/refresh', { signal })
      return (await response.json()) as unknown
    },
    logout: async (accessToken) => {
      await post('/auth/logout', {
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
      })
    },
  }
}

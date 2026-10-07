import { ApiError } from '../review-api'
import type { AuthApi, AuthApiMethod, GithubUserWire, SessionWire } from './auth-api'

/**
 * Stands in for the backend's httpOnly refresh cookie so reload-restore works in
 * mock mode. Mock-only: it holds the mock user, never an access token, and no
 * real adapter may use web storage for credentials.
 */
export const MOCK_REFRESH_KEY = 'dmc268.mock-auth.refresh'

/** Codes the mock authorize step issues; the exchange accepts only these. */
export const MOCK_CODE_PREFIX = 'mock-'

export const MOCK_USER: GithubUserWire = {
  id: 583231,
  login: 'octocat',
  name: 'The Octocat',
  avatar_url: 'https://avatars.githubusercontent.com/u/583231?v=4',
}

export interface MockAuthApiOptions {
  /** Artificial latency per call, in milliseconds. */
  delayMs?: number
  user?: GithubUserWire
  /** Access token lifetime; short by default so refresh is visible in dev. */
  tokenTtlSec?: number
  /** Methods that reject with a 500 error until switched off. */
  failures?: Iterable<AuthApiMethod>
  storage?: Storage
}

export interface MockAuthApi extends AuthApi {
  setFailure(method: AuthApiMethod, failing: boolean): void
}

export function createMockAuthApi(options: MockAuthApiOptions = {}): MockAuthApi {
  const delayMs = options.delayMs ?? 0
  const user = options.user ?? MOCK_USER
  const ttl = options.tokenTtlSec ?? 120
  const failing = new Set<AuthApiMethod>(options.failures)
  const storage = options.storage ?? window.sessionStorage
  let tokenCounter = 0

  async function respond<T>(method: AuthApiMethod, produce: () => T): Promise<T> {
    await new Promise((resolve) => setTimeout(resolve, delayMs))
    if (failing.has(method)) throw new ApiError(`Mock failure for ${method}`, 500)
    return produce()
  }

  function issue(sessionUser: GithubUserWire): SessionWire {
    tokenCounter += 1
    return {
      access_token: `mock-access-${String(tokenCounter)}`,
      expires_in: ttl,
      user: sessionUser,
    }
  }

  return {
    setFailure(method, isFailing) {
      if (isFailing) failing.add(method)
      else failing.delete(method)
    },
    exchange: ({ code }) =>
      respond('exchange', () => {
        if (!code.startsWith(MOCK_CODE_PREFIX)) {
          throw new ApiError('Invalid or expired authorization code', 400)
        }
        storage.setItem(MOCK_REFRESH_KEY, JSON.stringify(user))
        return issue(user)
      }),
    refresh: () =>
      respond('refresh', () => {
        const stored = storage.getItem(MOCK_REFRESH_KEY)
        if (stored === null) throw new ApiError('No session', 401)
        return issue(JSON.parse(stored) as GithubUserWire)
      }),
    logout: () =>
      respond('logout', () => {
        storage.removeItem(MOCK_REFRESH_KEY)
      }),
  }
}

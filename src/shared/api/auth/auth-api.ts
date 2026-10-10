/** GitHub user profile as the backend sends it (snake_case). */
export interface GithubUserWire {
  id: number
  login: string
  name: string | null
  avatar_url: string
}

/** App session returned by the exchange and refresh endpoints. */
export interface SessionWire {
  /** Short-lived app JWT; held in memory only. */
  access_token: string
  /** Lifetime of access_token, in seconds. */
  expires_in: number
  user: GithubUserWire
}

export interface ExchangeRequest {
  code: string
  codeVerifier: string
  redirectUri: string
}

/**
 * Transport boundary to the backend auth endpoints. The refresh credential is
 * an httpOnly cookie the backend sets, so it never passes through this API.
 * Like ReviewApi, methods resolve with unvalidated wire data.
 */
export interface AuthApi {
  /** Exchanges a GitHub authorization code; resolves with a SessionWire-shaped value. */
  exchange(request: ExchangeRequest, signal?: AbortSignal): Promise<unknown>
  /** Renews the session from the refresh cookie; rejects with ApiError 401 when there is none. */
  refresh(signal?: AbortSignal): Promise<unknown>
  /** Revokes the refresh cookie on the backend. */
  logout(accessToken: string | null): Promise<void>
}

export type AuthApiMethod = keyof AuthApi

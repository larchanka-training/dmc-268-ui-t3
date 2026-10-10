import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError, type AuthApi } from '@/shared/api'
import { refreshSession } from './refresh-session'
import { sessionStore } from './session-store'

const wire = {
  access_token: 'jwt-2',
  expires_in: 900,
  user: { id: 1, login: 'octocat', name: null, avatar_url: 'https://example.com/a.png' },
}

function authApi(refresh: AuthApi['refresh']): AuthApi {
  return { refresh, exchange: vi.fn(), logout: vi.fn() }
}

function signInAsBefore() {
  sessionStore.getState().actions.signIn({
    accessToken: 'jwt-1',
    expiresAt: Date.now() + 30_000,
    user: { id: 1, login: 'octocat', name: null, avatarUrl: 'https://example.com/a.png' },
  })
}

describe('refreshSession', () => {
  beforeEach(() => {
    sessionStore.getState().actions.reset()
  })

  it('stores the renewed session', async () => {
    signInAsBefore()
    await refreshSession(authApi(() => Promise.resolve(wire)))
    expect(sessionStore.getState().session?.accessToken).toBe('jwt-2')
  })

  it('shares one request between concurrent callers', async () => {
    const refresh = vi.fn(() => Promise.resolve(wire))
    const api = authApi(refresh)
    const results = await Promise.all([
      refreshSession(api),
      refreshSession(api),
      refreshSession(api),
    ])
    expect(refresh).toHaveBeenCalledTimes(1)
    expect(new Set(results).size).toBe(1)
  })

  it('signs a signed-in user out as expired on 401', async () => {
    signInAsBefore()
    await expect(
      refreshSession(authApi(() => Promise.reject(new ApiError('No session', 401)))),
    ).rejects.toBeInstanceOf(ApiError)
    expect(sessionStore.getState()).toMatchObject({ status: 'signed-out', reason: 'expired' })
  })

  it('keeps a signed-in user signed in after a transient failure', async () => {
    signInAsBefore()
    await expect(
      refreshSession(authApi(() => Promise.reject(new ApiError('Bad gateway', 502)))),
    ).rejects.toBeInstanceOf(ApiError)
    await expect(
      refreshSession(authApi(() => Promise.reject(new TypeError('Failed to fetch')))),
    ).rejects.toBeInstanceOf(TypeError)
    expect(sessionStore.getState()).toMatchObject({ status: 'signed-in', reason: null })
  })

  it('ends a page-load restore as signed out without the expired reason', async () => {
    await expect(
      refreshSession(authApi(() => Promise.reject(new ApiError('No session', 401)))),
    ).rejects.toBeInstanceOf(ApiError)
    expect(sessionStore.getState()).toMatchObject({ status: 'signed-out', reason: null })
  })
})

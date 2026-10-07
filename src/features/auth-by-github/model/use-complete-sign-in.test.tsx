import { renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { sessionStore } from '@/entities/session'
import { ApiError, type AuthApi } from '@/shared/api'
import { createMockAuthApi } from '@/shared/api/auth/mock-auth-api'
import type { AppConfig } from '@/shared/config/env'
import { createWrapper } from '@/shared/lib/test/render'
import { saveAttempt } from './sign-in-attempt'
import { useCompleteSignIn } from './use-complete-sign-in'

const config: AppConfig = {
  authMode: 'mock',
  githubClientId: null,
  githubRedirectUri: 'http://localhost:3000/auth/callback',
  apiBaseUrl: '/api',
}

function arrive(query: string, returnTo = '/?run=abc') {
  saveAttempt({ state: 'good-state', verifier: 'verifier-1', returnTo })
  window.history.replaceState(null, '', `/auth/callback${query}`)
}

function setup(authApi: AuthApi = createMockAuthApi()) {
  const exchange = vi.spyOn(authApi, 'exchange')
  const onSignedIn = vi.fn()
  const hook = renderHook(() => useCompleteSignIn({ config, onSignedIn }), {
    wrapper: createWrapper({ authApi }),
    reactStrictMode: true,
  })
  return { ...hook, exchange, onSignedIn }
}

describe('useCompleteSignIn', () => {
  beforeEach(() => {
    sessionStorage.clear()
    sessionStore.getState().actions.reset()
  })

  it('exchanges once, strips the query, signs in and returns to the saved path', async () => {
    arrive('?code=mock-123&state=good-state')
    const { exchange, onSignedIn } = setup()

    // Stripped synchronously, before the exchange resolves.
    expect(window.location.search).toBe('')
    await waitFor(() => {
      expect(onSignedIn).toHaveBeenCalledWith('/?run=abc')
    })
    expect(exchange).toHaveBeenCalledTimes(1)
    expect(exchange).toHaveBeenCalledWith({
      code: 'mock-123',
      codeVerifier: 'verifier-1',
      redirectUri: config.githubRedirectUri,
    })
    expect(sessionStore.getState().status).toBe('signed-in')
    // Navigation is left to the caller; the query stays stripped.
    expect(`${window.location.pathname}${window.location.search}`).toBe('/auth/callback')
    expect(sessionStorage.getItem('dmc268.auth.attempt')).toBeNull()
  })

  it('rejects a mismatched state without exchanging', async () => {
    arrive('?code=mock-123&state=forged')
    const { result, exchange } = setup()
    await waitFor(() => {
      expect(result.current).toEqual({ status: 'error', error: 'state-mismatch' })
    })
    expect(exchange).not.toHaveBeenCalled()
  })

  it('rejects a callback without a stored attempt, as after a reload', async () => {
    window.history.replaceState(null, '', '/auth/callback?code=mock-123&state=good-state')
    const { result, exchange } = setup()
    await waitFor(() => {
      expect(result.current).toEqual({ status: 'error', error: 'state-mismatch' })
    })
    expect(exchange).not.toHaveBeenCalled()
  })

  it('reports a denied authorization as cancelled', async () => {
    arrive('?error=access_denied&state=good-state')
    const { result, exchange } = setup()
    await waitFor(() => {
      expect(result.current).toEqual({ status: 'error', error: 'cancelled' })
    })
    expect(exchange).not.toHaveBeenCalled()
  })

  it('reports a failed exchange and stays signed out', async () => {
    arrive('?code=mock-123&state=good-state')
    const authApi: AuthApi = {
      ...createMockAuthApi(),
      exchange: () => Promise.reject(new ApiError('Bad code', 400)),
    }
    const { result } = setup(authApi)
    await waitFor(() => {
      expect(result.current).toEqual({ status: 'error', error: 'exchange-failed' })
    })
    expect(sessionStore.getState().status).not.toBe('signed-in')
  })

  it('reports a malformed session payload as a failed exchange', async () => {
    arrive('?code=mock-123&state=good-state')
    const authApi: AuthApi = {
      ...createMockAuthApi(),
      exchange: () => Promise.resolve({ access_token: 'x' }),
    }
    const { result } = setup(authApi)
    await waitFor(() => {
      expect(result.current).toEqual({ status: 'error', error: 'exchange-failed' })
    })
  })

  it('returns to / when the saved path points elsewhere', async () => {
    arrive('?code=mock-123&state=good-state', 'https://evil.example.com/')
    const { onSignedIn } = setup()
    await waitFor(() => {
      expect(onSignedIn).toHaveBeenCalledWith('/')
    })
  })
})

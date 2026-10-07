import { renderHook } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError, AuthApiProvider, type AuthApi } from '@/shared/api'
import { sessionStore } from '../model/session-store'
import { useSessionRefreshScheduler } from './use-session-refresh-scheduler'

const TTL_SEC = 15 * 60
const user = { id: 1, login: 'octocat', name: null, avatar_url: 'https://example.com/a.png' }

function setup(refresh: AuthApi['refresh']) {
  const api: AuthApi = { refresh, exchange: vi.fn(), logout: vi.fn() }
  const wrapper = ({ children }: { children: ReactNode }) => (
    <AuthApiProvider api={api}>{children}</AuthApiProvider>
  )
  return renderHook(
    () => {
      useSessionRefreshScheduler()
    },
    { wrapper },
  )
}

function signIn(expiresInMs: number) {
  sessionStore.getState().actions.signIn({
    accessToken: 'jwt-0',
    expiresAt: Date.now() + expiresInMs,
    user: { id: 1, login: 'octocat', name: null, avatarUrl: 'https://example.com/a.png' },
  })
}

let tokenCounter = 0
const renewed = () => {
  tokenCounter += 1
  return Promise.resolve({ access_token: `jwt-${String(tokenCounter)}`, expires_in: TTL_SEC, user })
}

function setVisibility(state: DocumentVisibilityState) {
  Object.defineProperty(document, 'visibilityState', { configurable: true, value: state })
  document.dispatchEvent(new Event('visibilitychange'))
}

describe('useSessionRefreshScheduler', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    tokenCounter = 0
    sessionStore.getState().actions.reset()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renews one minute before expiry and re-arms for the new token', async () => {
    signIn(TTL_SEC * 1000)
    const refresh = vi.fn(renewed)
    setup(refresh)

    await vi.advanceTimersByTimeAsync(14 * 60_000 - 1)
    expect(refresh).not.toHaveBeenCalled()
    await vi.advanceTimersByTimeAsync(1)
    expect(refresh).toHaveBeenCalledTimes(1)
    expect(sessionStore.getState().session?.accessToken).toBe('jwt-1')

    await vi.advanceTimersByTimeAsync(14 * 60_000)
    expect(refresh).toHaveBeenCalledTimes(2)
  })

  it('refreshes immediately when a sleeping tab becomes visible past the due time', async () => {
    signIn(TTL_SEC * 1000)
    const refresh = vi.fn(renewed)
    setup(refresh)

    // The timer did not fire while the tab slept; the clock moved on anyway.
    vi.setSystemTime(Date.now() + 14.5 * 60_000)
    setVisibility('visible')
    await vi.advanceTimersByTimeAsync(0)
    expect(refresh).toHaveBeenCalledTimes(1)
  })

  it('ignores visibility changes before the due time', async () => {
    signIn(TTL_SEC * 1000)
    const refresh = vi.fn(renewed)
    setup(refresh)
    setVisibility('visible')
    await vi.advanceTimersByTimeAsync(0)
    expect(refresh).not.toHaveBeenCalled()
  })

  it('retries transient failures with backoff while signed in', async () => {
    signIn(60_000)
    const refresh = vi
      .fn<AuthApi['refresh']>()
      .mockRejectedValueOnce(new ApiError('Bad gateway', 502))
      .mockRejectedValueOnce(new TypeError('Failed to fetch'))
      .mockImplementation(renewed)
    setup(refresh)

    await vi.advanceTimersByTimeAsync(0)
    expect(refresh).toHaveBeenCalledTimes(1)
    await vi.advanceTimersByTimeAsync(5_000)
    expect(refresh).toHaveBeenCalledTimes(2)
    await vi.advanceTimersByTimeAsync(15_000)
    expect(refresh).toHaveBeenCalledTimes(3)
    expect(sessionStore.getState()).toMatchObject({ status: 'signed-in' })
    expect(sessionStore.getState().session?.accessToken).toBe('jwt-1')
  })

  it('leaves no timers behind after sign-out', async () => {
    signIn(TTL_SEC * 1000)
    const refresh = vi.fn(renewed)
    setup(refresh)
    sessionStore.getState().actions.signOut()
    await vi.advanceTimersByTimeAsync(0)
    expect(vi.getTimerCount()).toBe(0)
    await vi.advanceTimersByTimeAsync(TTL_SEC * 1000)
    expect(refresh).not.toHaveBeenCalled()
  })
})

import { useEffect } from 'react'
import { useAuthApi } from '@/shared/api'
import { refreshSession } from '../model/refresh-session'
import { sessionStore, useSessionExpiresAt } from '../model/session-store'

/** Renewal starts this long before the access token expires. */
export const RENEW_BEFORE_MS = 60_000
/** Waits between attempts after a transient refresh failure; the last one repeats. */
export const RETRY_DELAYS_MS = [5_000, 15_000, 30_000] as const

/**
 * Keeps a signed-in session alive: refreshes at `expiresAt - 60s`, right away
 * when a sleeping tab becomes visible past that time, and retries transient
 * failures with backoff. Each successful refresh sets a new `expiresAt`, which
 * re-arms the effect.
 */
export function useSessionRefreshScheduler(): void {
  const authApi = useAuthApi()
  const expiresAt = useSessionExpiresAt()

  useEffect(() => {
    if (expiresAt === null) return
    const dueAt = expiresAt - RENEW_BEFORE_MS
    let timer: ReturnType<typeof setTimeout> | undefined
    let inFlight = false
    let attempt = 0
    let disposed = false

    function schedule(delayMs: number) {
      clearTimeout(timer)
      timer = setTimeout(renew, Math.max(0, delayMs))
    }

    function renew() {
      if (inFlight || disposed) return
      inFlight = true
      refreshSession(authApi).then(
        () => {
          inFlight = false
        },
        () => {
          inFlight = false
          if (disposed || sessionStore.getState().status !== 'signed-in') return
          const delays = RETRY_DELAYS_MS
          schedule(delays[Math.min(attempt, delays.length - 1)])
          attempt += 1
        },
      )
    }

    function onVisibilityChange() {
      if (document.visibilityState === 'visible' && Date.now() >= dueAt) {
        clearTimeout(timer)
        renew()
      }
    }

    schedule(dueAt - Date.now())
    document.addEventListener('visibilitychange', onVisibilityChange)
    return () => {
      disposed = true
      clearTimeout(timer)
      document.removeEventListener('visibilitychange', onVisibilityChange)
    }
  }, [authApi, expiresAt])
}

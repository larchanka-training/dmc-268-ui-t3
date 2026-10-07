import { ApiError, type AuthApi } from '@/shared/api'
import { parseSession, type Session } from './schema'
import { sessionStore } from './session-store'

let pending: Promise<Session> | null = null

async function run(authApi: AuthApi): Promise<Session> {
  const { actions } = sessionStore.getState()
  try {
    const session = parseSession(await authApi.refresh())
    actions.signIn(session)
    return session
  } catch (error) {
    const { status } = sessionStore.getState()
    if (status === 'restoring') {
      // Page load: whatever went wrong, there is no usable session yet.
      actions.signOut()
    } else if (error instanceof ApiError && error.status === 401 && status === 'signed-in') {
      actions.signOut('expired')
    }
    // Network errors and 5xx keep a signed-in user signed in; callers retry.
    throw error
  }
}

/**
 * Renews the session from the refresh cookie and stores the result. Concurrent
 * callers share one request. A 401 signs the user out with reason `expired`.
 */
export function refreshSession(authApi: AuthApi): Promise<Session> {
  pending ??= run(authApi).finally(() => {
    pending = null
  })
  return pending
}

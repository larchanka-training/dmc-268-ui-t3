/**
 * One sign-in attempt, kept in sessionStorage so it stays in this tab and
 * survives the round trip to GitHub. It is deleted as soon as the callback
 * reads it, so a reload of the callback cannot reuse it.
 */
export interface SignInAttempt {
  state: string
  verifier: string
  /** Same-origin path to return to after sign-in. */
  returnTo: string
}

export const SIGN_IN_ATTEMPT_KEY = 'dmc268.auth.attempt'

export function saveAttempt(attempt: SignInAttempt, storage: Storage = sessionStorage): void {
  storage.setItem(SIGN_IN_ATTEMPT_KEY, JSON.stringify(attempt))
}

/** Reads and deletes the stored attempt. */
export function takeAttempt(storage: Storage = sessionStorage): SignInAttempt | null {
  const raw = storage.getItem(SIGN_IN_ATTEMPT_KEY)
  storage.removeItem(SIGN_IN_ATTEMPT_KEY)
  if (raw === null) return null
  try {
    const value: unknown = JSON.parse(raw)
    if (
      value &&
      typeof value === 'object' &&
      'state' in value &&
      'verifier' in value &&
      'returnTo' in value &&
      typeof value.state === 'string' &&
      typeof value.verifier === 'string' &&
      typeof value.returnTo === 'string'
    ) {
      return { state: value.state, verifier: value.verifier, returnTo: value.returnTo }
    }
  } catch {
    // Corrupted entry: treat as no attempt.
  }
  return null
}

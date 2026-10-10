import { useEffect, useRef, useState } from 'react'
import { parseSession, useSessionActions } from '@/entities/session'
import { useAuthApi } from '@/shared/api'
import { CALLBACK_PATH, type AppConfig } from '@/shared/config/env'
import { safeReturnPath } from '../lib/return-path'
import { takeAttempt } from './sign-in-attempt'

export type SignInError = 'cancelled' | 'state-mismatch' | 'exchange-failed'

export type CompleteSignInState = { status: 'pending' } | { status: 'error'; error: SignInError }

interface CompleteSignInOptions {
  config: AppConfig
  /** Called with a safe same-origin path once the session is stored; it must navigate there. */
  onSignedIn: (returnTo: string) => void
}

/**
 * Finishes the OAuth round trip on /auth/callback. The query is read once and
 * stripped from the address bar before anything else happens; the ref keeps
 * StrictMode's second effect run from sending a second exchange.
 */
export function useCompleteSignIn({
  config,
  onSignedIn,
}: CompleteSignInOptions): CompleteSignInState {
  const authApi = useAuthApi()
  const { signIn } = useSessionActions()
  const [state, setState] = useState<CompleteSignInState>({ status: 'pending' })
  const started = useRef(false)
  const onSignedInRef = useRef(onSignedIn)
  useEffect(() => {
    onSignedInRef.current = onSignedIn
  })

  useEffect(() => {
    if (started.current) return
    started.current = true

    const params = new URLSearchParams(window.location.search)
    window.history.replaceState(null, '', CALLBACK_PATH)
    const attempt = takeAttempt()
    const fail = (error: SignInError) => {
      setState({ status: 'error', error })
    }

    const githubError = params.get('error')
    if (githubError !== null) {
      fail(githubError === 'access_denied' ? 'cancelled' : 'exchange-failed')
      return
    }
    const returnedState = params.get('state')
    if (attempt === null || returnedState === null || returnedState !== attempt.state) {
      fail('state-mismatch')
      return
    }
    const code = params.get('code')
    if (code === null || code === '') {
      fail('exchange-failed')
      return
    }

    authApi
      .exchange({ code, codeVerifier: attempt.verifier, redirectUri: config.githubRedirectUri })
      .then((wire) => {
        signIn(parseSession(wire))
        // The caller navigates (the app's router replaces the callback entry).
        onSignedInRef.current(safeReturnPath(attempt.returnTo, window.location.origin))
      })
      .catch(() => {
        fail('exchange-failed')
      })
  }, [authApi, config.githubRedirectUri, signIn])

  return state
}

import { MOCK_CODE_PREFIX } from '@/shared/api/auth/mock-auth-api'
import { CALLBACK_PATH, type AppConfig } from '@/shared/config/env'
import { createCodeChallenge, createCodeVerifier, createState } from '@/shared/lib/pkce'
import { safeReturnPath } from '../lib/return-path'
import { saveAttempt } from './sign-in-attempt'

export const GITHUB_AUTHORIZE_URL = 'https://github.com/login/oauth/authorize'

type SignInLocation = Pick<Location, 'assign' | 'origin' | 'pathname' | 'search' | 'hash'>

/**
 * Starts a sign-in attempt: stores a fresh state, PKCE verifier and the current
 * path for this tab, then leaves for GitHub. In mock mode it skips GitHub and
 * goes straight to the local callback with a mock code, through the same
 * state check.
 */
export async function startGithubSignIn(
  config: AppConfig,
  location: SignInLocation = window.location,
  storage: Storage = sessionStorage,
): Promise<void> {
  const state = createState()
  const verifier = createCodeVerifier()
  const returnTo = safeReturnPath(
    `${location.pathname}${location.search}${location.hash}`,
    location.origin,
  )
  saveAttempt({ state, verifier, returnTo }, storage)

  if (config.authMode === 'mock' || config.githubClientId === null) {
    const callback = new URL(CALLBACK_PATH, location.origin)
    callback.searchParams.set('code', `${MOCK_CODE_PREFIX}${createState()}`)
    callback.searchParams.set('state', state)
    location.assign(callback.toString())
    return
  }

  const authorize = new URL(GITHUB_AUTHORIZE_URL)
  authorize.searchParams.set('client_id', config.githubClientId)
  authorize.searchParams.set('redirect_uri', config.githubRedirectUri)
  authorize.searchParams.set('state', state)
  authorize.searchParams.set('code_challenge', await createCodeChallenge(verifier))
  authorize.searchParams.set('code_challenge_method', 'S256')
  location.assign(authorize.toString())
}

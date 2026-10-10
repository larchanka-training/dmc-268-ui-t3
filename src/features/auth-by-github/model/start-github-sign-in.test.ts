import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { AppConfig } from '@/shared/config/env'
import { createCodeChallenge } from '@/shared/lib/pkce'
import { SIGN_IN_ATTEMPT_KEY, takeAttempt } from './sign-in-attempt'
import { GITHUB_AUTHORIZE_URL, startGithubSignIn } from './start-github-sign-in'

const githubConfig: AppConfig = {
  authMode: 'github',
  githubClientId: 'Iv23liAbCdEf123456',
  githubRedirectUri: 'https://review.example.com/auth/callback',
  apiBaseUrl: '/api',
  githubAppInstallUrl: null,
}

function fakeLocation(path = '/?run=abc#finding-1') {
  const url = new URL(path, 'https://review.example.com')
  return {
    origin: url.origin,
    pathname: url.pathname,
    search: url.search,
    hash: url.hash,
    assign: vi.fn<(url: string | URL) => void>(),
  }
}

function assignedUrl(location: ReturnType<typeof fakeLocation>): URL {
  return new URL(String(location.assign.mock.calls[0]?.[0]))
}

describe('startGithubSignIn', () => {
  beforeEach(() => {
    sessionStorage.clear()
  })

  it('redirects to GitHub with client ID, callback, state and an S256 challenge', async () => {
    const location = fakeLocation()
    await startGithubSignIn(githubConfig, location)

    const url = assignedUrl(location)
    expect(`${url.origin}${url.pathname}`).toBe(GITHUB_AUTHORIZE_URL)
    const attempt = takeAttempt()
    expect(Object.fromEntries(url.searchParams)).toEqual({
      client_id: 'Iv23liAbCdEf123456',
      redirect_uri: 'https://review.example.com/auth/callback',
      state: attempt?.state,
      code_challenge: await createCodeChallenge(attempt?.verifier ?? ''),
      code_challenge_method: 'S256',
    })
  })

  it('uses a fresh state and challenge for each attempt', async () => {
    const first = fakeLocation()
    const second = fakeLocation()
    await startGithubSignIn(githubConfig, first)
    await startGithubSignIn(githubConfig, second)
    const [a, b] = [assignedUrl(first).searchParams, assignedUrl(second).searchParams]
    expect(a.get('state')).not.toBe(b.get('state'))
    expect(a.get('code_challenge')).not.toBe(b.get('code_challenge'))
  })

  it('stores the current path to return to, in this tab only', async () => {
    await startGithubSignIn(githubConfig, fakeLocation('/?run=abc#finding-1'))
    expect(localStorage.length).toBe(0)
    expect(sessionStorage.getItem(SIGN_IN_ATTEMPT_KEY)).not.toBeNull()
    expect(takeAttempt()?.returnTo).toBe('/?run=abc#finding-1')
  })

  it('goes straight to the local callback with a mock code in mock mode', async () => {
    const location = fakeLocation('/?run=abc')
    await startGithubSignIn({ ...githubConfig, authMode: 'mock', githubClientId: null }, location)
    const url = assignedUrl(location)
    expect(`${url.origin}${url.pathname}`).toBe('https://review.example.com/auth/callback')
    expect(url.searchParams.get('code')).toMatch(/^mock-/)
    expect(url.searchParams.get('state')).toBe(takeAttempt()?.state)
  })
})

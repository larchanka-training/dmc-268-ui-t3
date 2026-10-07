import { describe, expect, it } from 'vitest'
import { parseEnv } from './env'

const ORIGIN = 'http://localhost:5173'

const github = {
  VITE_AUTH_MODE: 'github',
  VITE_GITHUB_CLIENT_ID: 'Iv23liAbCdEf123456',
  VITE_GITHUB_REDIRECT_URI: 'https://review.example.com/auth/callback',
  VITE_API_BASE_URL: 'https://review.example.com/api/',
}

describe('parseEnv', () => {
  it('defaults to mock mode with a local callback and /api', () => {
    expect(parseEnv({}, ORIGIN)).toEqual({
      ok: true,
      config: {
        authMode: 'mock',
        githubClientId: null,
        githubRedirectUri: `${ORIGIN}/auth/callback`,
        apiBaseUrl: '/api',
      },
    })
  })

  it('treats empty .env values as unset', () => {
    const result = parseEnv({ VITE_AUTH_MODE: '', VITE_GITHUB_CLIENT_ID: '' }, ORIGIN)
    expect(result).toMatchObject({ ok: true, config: { authMode: 'mock', githubClientId: null } })
  })

  it('accepts a valid github configuration and trims the trailing slash of the API base', () => {
    expect(parseEnv(github, ORIGIN)).toEqual({
      ok: true,
      config: {
        authMode: 'github',
        githubClientId: 'Iv23liAbCdEf123456',
        githubRedirectUri: 'https://review.example.com/auth/callback',
        apiBaseUrl: 'https://review.example.com/api',
      },
    })
  })

  it('names a missing client ID in github mode', () => {
    const result = parseEnv({ ...github, VITE_GITHUB_CLIENT_ID: '' }, ORIGIN)
    expect(result).toEqual({
      ok: false,
      issues: [{ variable: 'VITE_GITHUB_CLIENT_ID', message: 'is required' }],
    })
  })

  it('names a malformed client ID', () => {
    const result = parseEnv({ ...github, VITE_GITHUB_CLIENT_ID: 'not a client id' }, ORIGIN)
    expect(result).toMatchObject({ ok: false, issues: [{ variable: 'VITE_GITHUB_CLIENT_ID' }] })
  })

  it.each([
    ['missing', undefined],
    ['relative', '/auth/callback'],
    ['wrong path', 'https://review.example.com/callback'],
    ['non-http scheme', 'ftp://review.example.com/auth/callback'],
  ])('names a %s redirect URI', (_label, value) => {
    const result = parseEnv({ ...github, VITE_GITHUB_REDIRECT_URI: value }, ORIGIN)
    expect(result).toMatchObject({
      ok: false,
      issues: [{ variable: 'VITE_GITHUB_REDIRECT_URI' }],
    })
  })

  it('rejects an unknown auth mode', () => {
    const result = parseEnv({ VITE_AUTH_MODE: 'gitlab' }, ORIGIN)
    expect(result).toMatchObject({ ok: false, issues: [{ variable: 'VITE_AUTH_MODE' }] })
  })
})

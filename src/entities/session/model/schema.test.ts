import { ZodError } from 'zod'
import { describe, expect, it } from 'vitest'
import { parseSession } from './schema'

const wire = {
  access_token: 'jwt',
  expires_in: 900,
  user: { id: 1, login: 'octocat', name: 'The Octocat', avatar_url: 'https://example.com/a.png' },
}

describe('parseSession', () => {
  it('maps the wire payload and computes expiry from the receive time', () => {
    expect(parseSession(wire, 1_000)).toEqual({
      accessToken: 'jwt',
      expiresAt: 1_000 + 900_000,
      user: {
        id: 1,
        login: 'octocat',
        name: 'The Octocat',
        avatarUrl: 'https://example.com/a.png',
      },
    })
  })

  it('throws a ZodError when a field is missing', () => {
    expect(() => parseSession({ ...wire, access_token: undefined })).toThrow(ZodError)
  })

  it('rejects a non-positive expires_in', () => {
    expect(() => parseSession({ ...wire, expires_in: -5 })).toThrow(ZodError)
  })
})

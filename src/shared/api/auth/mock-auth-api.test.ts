import { beforeEach, describe, expect, it } from 'vitest'
import { ApiError } from '../review-api'
import { createMockAuthApi, MOCK_REFRESH_KEY, MOCK_USER } from './mock-auth-api'

const exchange = { code: 'mock-abc', codeVerifier: 'v', redirectUri: 'http://x/auth/callback' }

describe('createMockAuthApi', () => {
  beforeEach(() => {
    sessionStorage.clear()
  })

  it('runs exchange → refresh → logout → refresh 401', async () => {
    const api = createMockAuthApi({ tokenTtlSec: 60 })

    await expect(api.exchange(exchange)).resolves.toEqual({
      access_token: 'mock-access-1',
      expires_in: 60,
      user: MOCK_USER,
    })
    await expect(api.refresh()).resolves.toMatchObject({ access_token: 'mock-access-2' })

    await api.logout('mock-access-2')
    const error: unknown = await api.refresh().catch((caught: unknown) => caught)
    expect(error).toBeInstanceOf(ApiError)
    expect(error).toMatchObject({ status: 401 })
  })

  it('restores the session in a new adapter instance, as after a reload', async () => {
    await createMockAuthApi().exchange(exchange)
    await expect(createMockAuthApi().refresh()).resolves.toMatchObject({ user: MOCK_USER })
  })

  it('rejects a code it did not issue', async () => {
    await expect(createMockAuthApi().exchange({ ...exchange, code: 'real' })).rejects.toMatchObject(
      { status: 400 },
    )
  })

  it('stores only the mock refresh marker, never the access token', async () => {
    const session = (await createMockAuthApi().exchange(exchange)) as { access_token: string }
    expect(Object.keys(sessionStorage)).toEqual([MOCK_REFRESH_KEY])
    expect(sessionStorage.getItem(MOCK_REFRESH_KEY)).not.toContain(session.access_token)
  })

  it('fails configured methods with a 500', async () => {
    const api = createMockAuthApi({ failures: ['exchange'] })
    await expect(api.exchange(exchange)).rejects.toMatchObject({ status: 500 })
    api.setFailure('exchange', false)
    await expect(api.exchange(exchange)).resolves.toBeDefined()
  })
})

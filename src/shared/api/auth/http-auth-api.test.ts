import { describe, expect, it, vi } from 'vitest'
import { ApiError } from '../review-api'
import { createHttpAuthApi } from './http-auth-api'

const session = {
  access_token: 'jwt',
  expires_in: 900,
  user: { id: 1, login: 'octocat', name: null, avatar_url: 'https://example.com/a.png' },
}

function stubFetch(response: Response) {
  return vi.fn<typeof fetch>().mockResolvedValue(response)
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

describe('createHttpAuthApi', () => {
  it('posts the exchange in snake_case with credentials', async () => {
    const fetchImpl = stubFetch(json(session))
    const api = createHttpAuthApi('/api', fetchImpl)

    await expect(
      api.exchange({ code: 'c', codeVerifier: 'v', redirectUri: 'http://x/auth/callback' }),
    ).resolves.toEqual(session)

    const [url, init] = fetchImpl.mock.calls[0] ?? []
    expect(url).toBe('/api/auth/github/exchange')
    expect(init).toMatchObject({ method: 'POST', credentials: 'include' })
    expect(JSON.parse(init?.body as string)).toEqual({
      code: 'c',
      code_verifier: 'v',
      redirect_uri: 'http://x/auth/callback',
    })
  })

  it('refreshes from the cookie without a body', async () => {
    const fetchImpl = stubFetch(json(session))
    await createHttpAuthApi('/api', fetchImpl).refresh()
    const [url, init] = fetchImpl.mock.calls[0] ?? []
    expect(url).toBe('/api/auth/refresh')
    expect(init).toMatchObject({ method: 'POST', credentials: 'include' })
    expect(init?.body).toBeUndefined()
  })

  it('sends the bearer token on logout', async () => {
    const fetchImpl = stubFetch(new Response(null, { status: 204 }))
    await createHttpAuthApi('/api', fetchImpl).logout('jwt')
    const [url, init] = fetchImpl.mock.calls[0] ?? []
    expect(url).toBe('/api/auth/logout')
    expect(init?.headers).toEqual({ Authorization: 'Bearer jwt' })
  })

  it('maps a non-2xx response to ApiError with the status and detail', async () => {
    const fetchImpl = stubFetch(json({ detail: 'No session' }, 401))
    const error: unknown = await createHttpAuthApi('/api', fetchImpl)
      .refresh()
      .catch((caught: unknown) => caught)
    expect(error).toBeInstanceOf(ApiError)
    expect(error).toMatchObject({ status: 401, message: 'No session' })
  })

  it('keeps a generic message for a non-JSON error body', async () => {
    const fetchImpl = stubFetch(new Response('Bad gateway', { status: 502 }))
    await expect(createHttpAuthApi('/api', fetchImpl).refresh()).rejects.toMatchObject({
      status: 502,
      message: 'Request failed with status 502',
    })
  })
})

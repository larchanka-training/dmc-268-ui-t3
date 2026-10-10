import { describe, expect, it, vi } from 'vitest'
import { ApiError } from '../review-api'
import { createAuthorizedFetch } from './authorized-fetch'

/** A fetch stub that answers 401 unless the request carries the accepted token. */
function backend(acceptedToken: () => string) {
  return vi.fn<typeof fetch>((_input, init) => {
    const auth = new Headers(init?.headers).get('Authorization')
    const status = auth === `Bearer ${acceptedToken()}` ? 200 : 401
    return Promise.resolve(new Response(status === 200 ? 'ok' : null, { status }))
  })
}

function setup(options: { refreshResult?: () => Promise<string> } = {}) {
  let token = 'old'
  let accepted = 'new'
  const onUnauthorized = vi.fn()
  const refresh = vi.fn(
    options.refreshResult ??
      (async () => {
        await Promise.resolve()
        token = 'new'
        return token
      }),
  )
  const fetchImpl = backend(() => accepted)
  const authorizedFetch = createAuthorizedFetch({
    getToken: () => token,
    refresh,
    onUnauthorized,
    fetchImpl,
  })
  return {
    authorizedFetch,
    fetchImpl,
    refresh,
    onUnauthorized,
    rejectAll: () => {
      accepted = 'nothing'
    },
  }
}

describe('createAuthorizedFetch', () => {
  it('sends the bearer token and keeps other headers', async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(new Response('ok'))
    const authorizedFetch = createAuthorizedFetch({
      getToken: () => 'abc',
      refresh: vi.fn(),
      onUnauthorized: vi.fn(),
      fetchImpl,
    })
    await authorizedFetch('/api/runs', { headers: { Accept: 'application/json' } })
    const headers = new Headers(fetchImpl.mock.calls[0]?.[1]?.headers)
    expect(headers.get('Authorization')).toBe('Bearer abc')
    expect(headers.get('Accept')).toBe('application/json')
  })

  it('refreshes once after a 401 and retries with the new token', async () => {
    const { authorizedFetch, fetchImpl, refresh, onUnauthorized } = setup()
    const response = await authorizedFetch('/api/runs/1', { method: 'POST', body: '{}' })
    expect(response.status).toBe(200)
    expect(refresh).toHaveBeenCalledTimes(1)
    expect(fetchImpl).toHaveBeenCalledTimes(2)
    expect(fetchImpl.mock.calls[1]?.[1]).toMatchObject({ method: 'POST', body: '{}' })
    expect(onUnauthorized).not.toHaveBeenCalled()
  })

  it('shares one refresh between concurrent 401s', async () => {
    const { authorizedFetch, refresh } = setup()
    const responses = await Promise.all([
      authorizedFetch('/a'),
      authorizedFetch('/b'),
      authorizedFetch('/c'),
    ])
    expect(responses.map((response) => response.status)).toEqual([200, 200, 200])
    expect(refresh).toHaveBeenCalledTimes(1)
  })

  it('signs out on a second 401 without refreshing again', async () => {
    const { authorizedFetch, refresh, onUnauthorized, rejectAll } = setup()
    rejectAll()
    const response = await authorizedFetch('/a')
    expect(response.status).toBe(401)
    expect(refresh).toHaveBeenCalledTimes(1)
    expect(onUnauthorized).toHaveBeenCalledTimes(1)
  })

  it('signs out when the refresh is rejected with 401', async () => {
    const { authorizedFetch, onUnauthorized } = setup({
      refreshResult: () => Promise.reject(new ApiError('No session', 401)),
    })
    await expect(authorizedFetch('/a')).rejects.toBeInstanceOf(ApiError)
    expect(onUnauthorized).toHaveBeenCalledTimes(1)
  })

  it('keeps the session when the refresh fails transiently', async () => {
    const { authorizedFetch, onUnauthorized } = setup({
      refreshResult: () => Promise.reject(new TypeError('Failed to fetch')),
    })
    await expect(authorizedFetch('/a')).rejects.toBeInstanceOf(TypeError)
    expect(onUnauthorized).not.toHaveBeenCalled()
  })
})

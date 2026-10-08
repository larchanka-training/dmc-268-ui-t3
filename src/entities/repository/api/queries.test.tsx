import { renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ApiError, type ReviewApi } from '@/shared/api'
import { createMockReviewApi } from '@/shared/api/mock/mock-review-api'
import { mockRepositoryState } from '@/shared/api/mock/repositories.mock'
import { createWrapper } from '@/shared/lib/test/render'
import { repositoryKeys, useAvailableRepositories, useRepositories, useRepository } from './queries'

describe('useRepositories', () => {
  it('parses the list and passes the abort signal', async () => {
    const api = createMockReviewApi()
    const listRepositories = vi.spyOn(api, 'listRepositories')
    const { result } = renderHook(() => useRepositories(), { wrapper: createWrapper({ api }) })
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })
    expect(result.current.data).toHaveLength(mockRepositoryState.connected.length)
    expect(result.current.data?.[0]).toMatchObject({ id: 'repo-1', fullName: 'acme/web' })
    expect(listRepositories.mock.calls[0]?.[0]).toBeInstanceOf(AbortSignal)
  })

  it('enters the error state for an unsafe URL', async () => {
    const api: ReviewApi = {
      ...createMockReviewApi(),
      listRepositories: () =>
        Promise.resolve([{ ...mockRepositoryState.connected[0], url: 'javascript:alert(1)' }]),
    }
    const { result } = renderHook(() => useRepositories(), { wrapper: createWrapper({ api }) })
    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })
    expect(result.current.data).toBeUndefined()
  })
})

describe('useAvailableRepositories', () => {
  it('parses the list and passes the abort signal', async () => {
    const api = createMockReviewApi()
    const listAvailable = vi.spyOn(api, 'listAvailableRepositories')
    const { result } = renderHook(() => useAvailableRepositories(), {
      wrapper: createWrapper({ api }),
    })
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })
    expect(result.current.data?.filter((item) => item.isConnected)).toHaveLength(3)
    expect(listAvailable.mock.calls[0]?.[0]).toBeInstanceOf(AbortSignal)
  })

  it('enters the error state for an unknown provider', async () => {
    const api: ReviewApi = {
      ...createMockReviewApi(),
      listAvailableRepositories: () =>
        Promise.resolve([{ ...mockRepositoryState.available[0], provider: 'bitbucket' }]),
    }
    const { result } = renderHook(() => useAvailableRepositories(), {
      wrapper: createWrapper({ api }),
    })
    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })
  })
})

describe('useRepository', () => {
  it('parses one repository and passes the abort signal', async () => {
    const api = createMockReviewApi()
    const getRepository = vi.spyOn(api, 'getRepository')
    const { result } = renderHook(() => useRepository('repo-2'), {
      wrapper: createWrapper({ api }),
    })
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })
    expect(result.current.data).toMatchObject({ id: 'repo-2', fullName: 'acme/billing-api' })
    expect(getRepository).toHaveBeenCalledWith('repo-2', expect.any(AbortSignal))
  })

  it('surfaces a 404 as an ApiError', async () => {
    const api = createMockReviewApi()
    const getRepository = vi.spyOn(api, 'getRepository')
    const { result } = renderHook(() => useRepository('unknown'), {
      wrapper: createWrapper({ api }),
    })
    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })
    expect(result.current.error).toBeInstanceOf(ApiError)
    expect(result.current.error).toMatchObject({ status: 404 })
    expect(getRepository).toHaveBeenCalledTimes(1)
  })

  it('keys a repository apart from the list keys', () => {
    expect(repositoryKeys.detail('connected')).not.toEqual(repositoryKeys.connected)
    expect(repositoryKeys.detail('repo-1').slice(0, 1)).toEqual(repositoryKeys.all)
  })
})

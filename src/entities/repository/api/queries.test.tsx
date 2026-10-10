import { renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { ReviewApi } from '@/shared/api'
import { createMockReviewApi } from '@/shared/api/mock/mock-review-api'
import { mockRepositoryState } from '@/shared/api/mock/repositories.mock'
import { createWrapper } from '@/shared/lib/test/render'
import { useAvailableRepositories, useRepositories } from './queries'

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
    expect(result.current.data?.filter((item) => item.isConnected)).toHaveLength(2)
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

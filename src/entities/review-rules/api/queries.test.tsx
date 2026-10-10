import { renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { ReviewApi } from '@/shared/api'
import { createMockReviewApi } from '@/shared/api/mock/mock-review-api'
import { mockRepositoryState } from '@/shared/api/mock/repositories.mock'
import { createWrapper } from '@/shared/lib/test/render'
import { useRepositoryRules } from './queries'

describe('useRepositoryRules', () => {
  it('parses the rules and passes the abort signal', async () => {
    const api = createMockReviewApi()
    const getRepositoryRules = vi.spyOn(api, 'getRepositoryRules')
    const { result } = renderHook(() => useRepositoryRules('repo-3'), {
      wrapper: createWrapper({ api }),
    })
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })
    expect(result.current.data?.status).toBe('invalid')
    expect(getRepositoryRules).toHaveBeenCalledWith('repo-3', expect.any(AbortSignal))
  })

  it('enters the error state for an unsafe file URL', async () => {
    const api: ReviewApi = {
      ...createMockReviewApi(),
      getRepositoryRules: () =>
        Promise.resolve({
          ...mockRepositoryState.rules['repo-1'],
          file_url: 'javascript:alert(1)',
        }),
    }
    const { result } = renderHook(() => useRepositoryRules('repo-1'), {
      wrapper: createWrapper({ api }),
    })
    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })
  })
})

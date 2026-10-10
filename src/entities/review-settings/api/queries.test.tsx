import { renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { createMockReviewApi } from '@/shared/api/mock/mock-review-api'
import { createWrapper } from '@/shared/lib/test/render'
import { reviewSettingsKeys, useReviewSettings } from './queries'

describe('useReviewSettings', () => {
  it('parses the settings and passes the abort signal', async () => {
    const api = createMockReviewApi()
    const getReviewSettings = vi.spyOn(api, 'getReviewSettings')
    const { result } = renderHook(() => useReviewSettings('repo-3'), {
      wrapper: createWrapper({ api }),
    })
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })
    expect(result.current.data).toMatchObject({
      autoReview: false,
      severityThreshold: 'critical_only',
    })
    expect(getReviewSettings).toHaveBeenCalledWith('repo-3', expect.any(AbortSignal))
  })

  it('sits under the repository key', () => {
    expect(reviewSettingsKeys.detail('repo-1')).toEqual([
      'repositories',
      'byId',
      'repo-1',
      'settings',
    ])
  })
})

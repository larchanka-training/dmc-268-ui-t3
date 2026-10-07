import { renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { ReviewApi, ReviewRunWire } from '@/shared/api'
import { mockAppState } from '@/shared/api/mock/app-state.mock'
import { createMockReviewApi } from '@/shared/api/mock/mock-review-api'
import { createWrapper } from '@/shared/lib/test/render'
import { useReviewRun, useReviewRuns } from './queries'

function runWire(runId: string, title: string): ReviewRunWire {
  return { ...mockAppState.server.run, run_id: runId, title }
}

describe('useReviewRun', () => {
  it('parses the wire payload into the view model', async () => {
    const { result } = renderHook(() => useReviewRun(mockAppState.server.run.run_id), {
      wrapper: createWrapper(),
    })
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })
    expect(result.current.data).toMatchObject({
      id: mockAppState.server.run.run_id,
      pullRequest: 42,
      coverage: { status: 'partial' },
      headSha: mockAppState.server.run.head_sha,
    })
  })

  it('shows only the latest run when an older request resolves last', async () => {
    const resolvers = new Map<string, (value: unknown) => void>()
    const api: ReviewApi = {
      ...createMockReviewApi(),
      getRun: (runId) =>
        new Promise((resolve) => {
          resolvers.set(runId, resolve)
        }),
    }
    const { result, rerender } = renderHook(({ runId }) => useReviewRun(runId), {
      wrapper: createWrapper({ api }),
      initialProps: { runId: 'run-a' },
    })
    rerender({ runId: 'run-b' })
    await waitFor(() => {
      expect(resolvers.size).toBe(2)
    })
    resolvers.get('run-b')?.(runWire('run-b', 'Run B'))
    await waitFor(() => {
      expect(result.current.data?.title).toBe('Run B')
    })
    resolvers.get('run-a')?.(runWire('run-a', 'Run A'))
    await new Promise((resolve) => setTimeout(resolve, 0))
    expect(result.current.data?.title).toBe('Run B')
  })

  it('enters the error state for an invalid payload', async () => {
    const api: ReviewApi = {
      ...createMockReviewApi(),
      getRun: () => Promise.resolve({ ...mockAppState.server.run, status: 'DONE' }),
    }
    const { result } = renderHook(() => useReviewRun('x'), { wrapper: createWrapper({ api }) })
    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })
    expect(result.current.data).toBeUndefined()
  })
})

describe('useReviewRuns', () => {
  it('parses the list and passes the abort signal', async () => {
    const api = createMockReviewApi()
    const listRuns = vi.spyOn(api, 'listRuns')
    const { result } = renderHook(() => useReviewRuns(), { wrapper: createWrapper({ api }) })
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })
    expect(result.current.data).toEqual([
      expect.objectContaining({ id: mockAppState.server.run.run_id, pullRequest: 42 }),
    ])
    expect(listRuns.mock.calls[0]?.[0]).toBeInstanceOf(AbortSignal)
  })

  it('enters the error state when one entry is invalid', async () => {
    const api: ReviewApi = {
      ...createMockReviewApi(),
      listRuns: () =>
        Promise.resolve([runWire('run-a', 'A'), { ...runWire('run-b', 'B'), status: 'DONE' }]),
    }
    const { result } = renderHook(() => useReviewRuns(), { wrapper: createWrapper({ api }) })
    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })
    expect(result.current.data).toBeUndefined()
  })
})

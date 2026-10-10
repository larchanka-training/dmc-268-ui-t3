import { renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { ReviewApi } from '@/shared/api'
import { mockAppState, RUN_ID } from '@/shared/api/mock/app-state.mock'
import { createMockReviewApi } from '@/shared/api/mock/mock-review-api'
import { createWrapper } from '@/shared/lib/test/render'
import { useFindings } from './queries'

describe('useFindings', () => {
  it('parses findings into the view model', async () => {
    const { result } = renderHook(() => useFindings(RUN_ID), { wrapper: createWrapper() })
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })
    expect(result.current.data).toHaveLength(mockAppState.server.findings.length)
    expect(result.current.data?.[0]).toMatchObject({
      id: 'f-sql-injection',
      ruleId: 'SEC-SQL-001',
      anchor: { path: 'src/services/user-service.ts', side: 'RIGHT', line: 46 },
      relatedChangedLines: [{ side: 'RIGHT', line: 46 }],
    })
  })

  it('rejects the whole list when one finding has an unknown severity', async () => {
    const [first, ...rest] = mockAppState.server.findings
    const api: ReviewApi = {
      ...createMockReviewApi(),
      getFindings: () => Promise.resolve([{ ...first, severity: 'blocker' }, ...rest]),
    }
    const { result } = renderHook(() => useFindings(RUN_ID), { wrapper: createWrapper({ api }) })
    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })
    expect(result.current.data).toBeUndefined()
  })
})

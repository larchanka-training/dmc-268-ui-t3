import { describe, expect, it } from 'vitest'
import { mockAppState } from '@/shared/api/mock/app-state.mock'
import { reviewRunSchema } from '../model/schema'
import { sortRunsNewestFirst } from './sort'

function run(id: string, createdAt: string) {
  return reviewRunSchema.parse({ ...mockAppState.server.run, run_id: id, created_at: createdAt })
}

describe('sortRunsNewestFirst', () => {
  it('orders by creation time, newest first, without mutating the input', () => {
    const runs = [
      run('old', '2026-10-01T10:00:00Z'),
      run('new', '2026-10-07T10:00:00Z'),
      run('mid', '2026-10-03T10:00:00Z'),
    ]
    expect(sortRunsNewestFirst(runs).map((item) => item.id)).toEqual(['new', 'mid', 'old'])
    expect(runs.map((item) => item.id)).toEqual(['old', 'new', 'mid'])
  })
})

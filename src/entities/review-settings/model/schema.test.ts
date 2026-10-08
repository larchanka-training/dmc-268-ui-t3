import { describe, expect, it } from 'vitest'
import { mockRepositoryState } from '@/shared/api/mock/repositories.mock'
import { reviewSettingsSchema } from './schema'

const wire = mockRepositoryState.settings['repo-1']

describe('reviewSettingsSchema', () => {
  it('maps the wire settings to the view model', () => {
    expect(reviewSettingsSchema.parse(wire)).toEqual({
      autoReview: true,
      branchFilter: ['main', 'release/*'],
      severityThreshold: 'warning_and_critical',
      updatedAt: '2026-10-02T11:20:00Z',
    })
  })

  it('rejects an unknown threshold', () => {
    expect(
      reviewSettingsSchema.safeParse({ ...wire, severity_threshold: 'medium_and_up' }).success,
    ).toBe(false)
  })

  it('rejects a non-boolean automatic review flag', () => {
    expect(reviewSettingsSchema.safeParse({ ...wire, auto_review: 'yes' }).success).toBe(false)
  })

  it('rejects an empty branch pattern', () => {
    expect(reviewSettingsSchema.safeParse({ ...wire, branch_filter: [' '] }).success).toBe(false)
  })
})

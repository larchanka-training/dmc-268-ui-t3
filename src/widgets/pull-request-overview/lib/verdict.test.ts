import { describe, expect, it } from 'vitest'
import { deriveScore, deriveVerdict } from './verdict'

const groups = (critical = 0, warning = 0, info = 0) => ({ critical, warning, info })
const levels = (critical = 0, high = 0, medium = 0, low = 0) => ({ critical, high, medium, low })

describe('deriveVerdict', () => {
  it.each(['NEW', 'QUEUED', 'RUNNING'] as const)('is in progress while %s', (runStatus) => {
    expect(deriveVerdict({ runStatus, coverageStatus: 'complete', groupCounts: groups(3) })).toBe(
      'in_progress',
    )
  })

  it.each([
    ['FAILED', 'complete'],
    ['CANCELLED', 'partial'],
    ['COMPLETED', 'failed'],
  ] as const)('gives no verdict for %s with %s coverage', (runStatus, coverageStatus) => {
    expect(deriveVerdict({ runStatus, coverageStatus, groupCounts: groups(1) })).toBe('no_verdict')
  })

  it('requests changes when there is a critical finding', () => {
    expect(
      deriveVerdict({
        runStatus: 'COMPLETED',
        coverageStatus: 'partial',
        groupCounts: groups(1, 2),
      }),
    ).toBe('changes_requested')
  })

  it('needs attention with warnings but no critical findings', () => {
    expect(
      deriveVerdict({
        runStatus: 'COMPLETED',
        coverageStatus: 'complete',
        groupCounts: groups(0, 1, 4),
      }),
    ).toBe('needs_attention')
  })

  it('never passes with partial coverage', () => {
    expect(
      deriveVerdict({
        runStatus: 'COMPLETED',
        coverageStatus: 'partial',
        groupCounts: groups(0, 0, 2),
      }),
    ).toBe('partially_reviewed')
  })

  it('has no blocking issues for a complete review with only info findings', () => {
    expect(
      deriveVerdict({
        runStatus: 'COMPLETED',
        coverageStatus: 'complete',
        groupCounts: groups(0, 0, 2),
      }),
    ).toBe('no_blocking_issues')
    expect(
      deriveVerdict({ runStatus: 'COMPLETED', coverageStatus: 'complete', groupCounts: groups() }),
    ).toBe('no_blocking_issues')
  })
})

describe('deriveScore', () => {
  it('deducts weighted points per finding', () => {
    expect(
      deriveScore({
        runStatus: 'COMPLETED',
        coverageStatus: 'complete',
        levelCounts: levels(1, 2, 1, 1),
      }),
    ).toBe(54)
  })

  it('is floored at zero', () => {
    expect(
      deriveScore({ runStatus: 'COMPLETED', coverageStatus: 'complete', levelCounts: levels(5) }),
    ).toBe(0)
  })

  it('is 100 without findings', () => {
    expect(
      deriveScore({ runStatus: 'COMPLETED', coverageStatus: 'complete', levelCounts: levels() }),
    ).toBe(100)
  })

  it('is unavailable with partial coverage', () => {
    expect(
      deriveScore({ runStatus: 'COMPLETED', coverageStatus: 'partial', levelCounts: levels() }),
    ).toBeNull()
  })

  it('is unavailable while running', () => {
    expect(
      deriveScore({ runStatus: 'RUNNING', coverageStatus: 'complete', levelCounts: levels() }),
    ).toBeNull()
  })
})

import { describe, expect, it } from 'vitest'
import type { FindingWire } from '@/shared/api'
import { mockAppState } from '@/shared/api/mock/app-state.mock'
import { findingSchema } from './schema'

const rightAnchored = mockAppState.server.findings.find(
  (finding) => finding.anchor.side === 'RIGHT',
) as FindingWire
const base: FindingWire = { ...rightAnchored, suggested_change: undefined }

describe('findingSchema suggested change', () => {
  it('maps a missing suggestion to null', () => {
    expect(findingSchema.parse(base).suggestedChange).toBeNull()
  })

  it('maps a valid suggestion to the view model', () => {
    const finding = findingSchema.parse({
      ...base,
      suggested_change: { start_line: 35, end_line: 36, replacement: 'DEBUG = False' },
    })
    expect(finding.suggestedChange).toEqual({
      startLine: 35,
      endLine: 36,
      replacement: 'DEBUG = False',
    })
  })

  it('accepts an empty replacement (a removal suggestion)', () => {
    const finding = findingSchema.parse({
      ...base,
      suggested_change: { start_line: 4, end_line: 4, replacement: '' },
    })
    expect(finding.suggestedChange?.replacement).toBe('')
  })

  it('rejects an inverted range', () => {
    const result = findingSchema.safeParse({
      ...base,
      suggested_change: { start_line: 40, end_line: 38, replacement: 'x' },
    })
    expect(result.success).toBe(false)
  })

  it('rejects a non-positive first line', () => {
    const result = findingSchema.safeParse({
      ...base,
      suggested_change: { start_line: 0, end_line: 1, replacement: 'x' },
    })
    expect(result.success).toBe(false)
  })

  it('rejects a suggestion on a LEFT anchor', () => {
    const result = findingSchema.safeParse({
      ...base,
      anchor: { ...base.anchor, side: 'LEFT' },
      suggested_change: { start_line: 1, end_line: 1, replacement: 'x' },
    })
    expect(result.success).toBe(false)
  })
})

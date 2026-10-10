import { describe, expect, it } from 'vitest'
import { NO_EXPANSION, type GapExpansion } from '../model/diff-view-store'
import type { DiffFile } from '../model/types'
import { parseUnifiedDiff } from './parse-unified-diff'
import {
  buildSplitRows,
  buildUnifiedRows,
  computeGaps,
  toContentLines,
  type RowSource,
} from './rows'

function parseFile(...lines: string[]): DiffFile {
  const result = parseUnifiedDiff(lines.join('\n') + '\n')
  if (!result.ok) throw new Error(result.error.message)
  return result.files[0]
}

/** 100-line file "line 1".."line 100"; the diff changes line 51 and line 80. */
const content = Array.from({ length: 100 }, (_, i) => `line ${String(i + 1)}`).join('\n') + '\n'
const twoHunks = parseFile(
  '--- a/f.ts',
  '+++ b/f.ts',
  '@@ -50,3 +50,3 @@',
  ' line 50',
  '-old 51',
  '+line 51',
  ' line 52',
  '@@ -79,3 +79,3 @@',
  ' line 79',
  '-old 80',
  '+line 80',
  ' line 81',
)

function source(overrides: Partial<RowSource> = {}): RowSource {
  return {
    file: twoHunks,
    contentLines: toContentLines(content),
    expansionOf: () => NO_EXPANSION,
    ...overrides,
  }
}

describe('computeGaps', () => {
  it('finds leading, between and trailing gaps', () => {
    expect(computeGaps(twoHunks, toContentLines(content))).toEqual([
      expect.objectContaining({
        position: 'leading',
        newStart: 1,
        oldStart: 1,
        size: 49,
        expandable: true,
      }),
      expect.objectContaining({ position: 'between', newStart: 53, oldStart: 53, size: 26 }),
      expect.objectContaining({ position: 'trailing', newStart: 82, oldStart: 82, size: 19 }),
    ])
  })

  it('omits the trailing gap and disables expansion without content', () => {
    const gaps = computeGaps(twoHunks, null)
    expect(gaps).toHaveLength(2)
    expect(gaps.every((gap) => !gap.expandable)).toBe(true)
  })

  it('has no gaps for an added file', () => {
    const file = parseFile('--- /dev/null', '+++ b/n.ts', '@@ -0,0 +1,2 @@', '+a', '+b')
    expect(computeGaps(file, ['a', 'b'])).toEqual([])
  })
})

describe('buildUnifiedRows', () => {
  it('shows gap rows with their hidden line counts', () => {
    const rows = buildUnifiedRows(source())
    const gaps = rows.flatMap((row) => (row.type === 'gap' ? [row.data.hiddenCount] : []))
    expect(gaps).toEqual([49, 26, 19])
  })

  it('reveals expanded lines with correct numbers on both sides', () => {
    const expansions: Record<number, GapExpansion> = { 1: { top: 20, bottom: 0 } }
    const rows = buildUnifiedRows(
      source({ expansionOf: (index) => expansions[index] ?? NO_EXPANSION }),
    )
    const revealed = rows.flatMap((row) =>
      row.type === 'line' && row.line.expanded ? [row.line] : [],
    )
    expect(revealed).toHaveLength(20)
    expect(revealed[0]).toMatchObject({ oldNo: 53, newNo: 53, content: 'line 53' })
    expect(revealed[19]).toMatchObject({ oldNo: 72, newNo: 72, content: 'line 72' })
    const gap = rows.find((row) => row.type === 'gap' && row.data.gap.index === 1)
    expect(gap?.type === 'gap' && gap.data.hiddenCount).toBe(6)
  })

  it('offsets old numbers when earlier hunks change the line count', () => {
    const file = parseFile(
      '--- a/f.ts',
      '+++ b/f.ts',
      '@@ -1,2 +1,3 @@',
      ' a',
      '+b',
      ' c',
      '@@ -10 +11 @@',
      '-x',
      '+y',
    )
    const lines = ['a', 'b', 'c', ...Array.from({ length: 10 }, (_, i) => `n${String(i + 4)}`)]
    const rows = buildUnifiedRows({
      file,
      contentLines: lines,
      expansionOf: () => ({ top: 1, bottom: 0 }),
    })
    const firstExpanded = rows.find((row) => row.type === 'line' && row.line.expanded)
    expect(firstExpanded?.type === 'line' && firstExpanded.line).toMatchObject({
      oldNo: 3,
      newNo: 4,
    })
  })

  it('removes a gap row once all its lines are revealed', () => {
    const rows = buildUnifiedRows(source({ expansionOf: () => ({ top: 1000, bottom: 0 }) }))
    expect(rows.some((row) => row.type === 'gap')).toBe(false)
    expect(rows.filter((row) => row.type === 'line')).toHaveLength(100 + 2)
  })
})

describe('buildSplitRows', () => {
  it('pairs removed and added lines and pads the shorter side', () => {
    const file = parseFile(
      '--- a/f.ts',
      '+++ b/f.ts',
      '@@ -1,3 +1,5 @@',
      ' a',
      '-b',
      '+b1',
      '+b2',
      '+b3',
      ' c',
    )
    const rows = buildSplitRows({ file, contentLines: null, expansionOf: () => NO_EXPANSION })
    const cells = rows.map((row) =>
      row.type === 'pair' ? [row.left?.content ?? null, row.right?.content ?? null] : ['gap'],
    )
    expect(cells).toEqual([
      ['a', 'a'],
      ['b', 'b1'],
      [null, 'b2'],
      [null, 'b3'],
      ['c', 'c'],
    ])
  })

  it('keeps gap rows between hunks', () => {
    const rows = buildSplitRows(source())
    expect(rows.filter((row) => row.type === 'gap')).toHaveLength(3)
  })
})

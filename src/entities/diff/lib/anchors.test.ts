import { describe, expect, it } from 'vitest'
import type { LineAnchor } from '@/shared/lib/line-anchor'
import { NO_EXPANSION } from '../model/diff-view-store'
import type { DiffFile } from '../model/types'
import {
  anchorBelongsToFile,
  expansionsForAnchors,
  placeOnSplitRows,
  placeOnUnifiedRows,
} from './anchors'
import { parseUnifiedDiff } from './parse-unified-diff'
import { buildSplitRows, buildUnifiedRows, computeGaps, toContentLines } from './rows'

function parseFile(...lines: string[]): DiffFile {
  const result = parseUnifiedDiff(lines.join('\n') + '\n')
  if (!result.ok) throw new Error(result.error.message)
  return result.files[0]
}

const content = toContentLines(
  Array.from({ length: 60 }, (_, i) => `line ${String(i + 1)}`).join('\n'),
)
const file = parseFile(
  '--- a/f.ts',
  '+++ b/f.ts',
  '@@ -30,3 +30,3 @@',
  ' line 30',
  '-old 31',
  '+line 31',
  ' line 32',
)
const at = (side: LineAnchor['side'], line: number, path = 'f.ts'): LineAnchor => ({
  path,
  side,
  line,
})

describe('expansionsForAnchors', () => {
  it('reveals an anchored context line from the closer end of the gap', () => {
    const expansion = expansionsForAnchors(file, content, () => NO_EXPANSION, [
      at('RIGHT', 27),
      at('LEFT', 2),
    ])
    // Leading gap covers lines 1..29: line 27 is 3 lines from the bottom, line 2 is 2 from the top.
    expect(expansion(0)).toEqual({ top: 2, bottom: 3 })
  })

  it('keeps a larger user expansion', () => {
    const expansion = expansionsForAnchors(file, content, () => ({ top: 10, bottom: 0 }), [
      at('RIGHT', 5),
    ])
    expect(expansion(0)).toEqual({ top: 10, bottom: 0 })
  })

  it('ignores anchors on changed lines and other files', () => {
    const expansion = expansionsForAnchors(file, content, () => NO_EXPANSION, [
      at('RIGHT', 31),
      at('RIGHT', 5, 'other.ts'),
    ])
    expect(expansion(0)).toEqual(NO_EXPANSION)
  })

  it('cannot reveal lines when content is unavailable', () => {
    const expansion = expansionsForAnchors(file, null, () => NO_EXPANSION, [at('RIGHT', 5)])
    expect(expansion(0)).toEqual(NO_EXPANSION)
    expect(computeGaps(file, null)[0].expandable).toBe(false)
  })
})

describe('placement', () => {
  const items = [
    { id: 'changed-right', anchor: at('RIGHT', 31) },
    { id: 'changed-left', anchor: at('LEFT', 31) },
    { id: 'context-left', anchor: at('LEFT', 32) },
    { id: 'hidden', anchor: at('RIGHT', 5) },
    { id: 'beyond-end', anchor: at('RIGHT', 999) },
  ]

  it('places items on unified rows and reports the rest as unplaced', () => {
    const rows = buildUnifiedRows({ file, contentLines: content, expansionOf: () => NO_EXPANSION })
    const { byRow, unplaced } = placeOnUnifiedRows(rows, items)
    expect(byRow.get('add:null:31')?.RIGHT.map((item) => item.id)).toEqual(['changed-right'])
    expect(byRow.get('del:31:null')?.LEFT.map((item) => item.id)).toEqual(['changed-left'])
    expect(byRow.get('ctx:32:32')?.LEFT.map((item) => item.id)).toEqual(['context-left'])
    expect(unplaced.map((item) => item.id)).toEqual(['hidden', 'beyond-end'])
  })

  it('places a gap anchor once the gap is expanded for it', () => {
    const expansionOf = expansionsForAnchors(file, content, () => NO_EXPANSION, [at('RIGHT', 5)])
    const rows = buildUnifiedRows({ file, contentLines: content, expansionOf })
    const { byRow, unplaced } = placeOnUnifiedRows(rows, [items[3]])
    expect(byRow.get('ctx:5:5')?.RIGHT).toHaveLength(1)
    expect(unplaced).toEqual([])
  })

  it('places items on the column of their side in split rows', () => {
    const rows = buildSplitRows({ file, contentLines: content, expansionOf: () => NO_EXPANSION })
    const { byRow } = placeOnSplitRows(rows, items.slice(0, 2))
    expect(byRow.get('del:31:null|add:null:31')).toEqual({ LEFT: [items[1]], RIGHT: [items[0]] })
  })
})

describe('anchorBelongsToFile', () => {
  it('matches LEFT anchors to the old path and RIGHT anchors to the new path', () => {
    const renamed = parseFile(
      'diff --git a/old.ts b/new.ts',
      'rename from old.ts',
      'rename to new.ts',
    )
    expect(anchorBelongsToFile(renamed, at('LEFT', 1, 'old.ts'))).toBe(true)
    expect(anchorBelongsToFile(renamed, at('RIGHT', 1, 'new.ts'))).toBe(true)
    expect(anchorBelongsToFile(renamed, at('RIGHT', 1, 'old.ts'))).toBe(false)
  })
})

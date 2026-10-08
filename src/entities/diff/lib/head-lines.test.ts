import { describe, expect, it } from 'vitest'
import type { DiffFile } from '../model/types'
import { headLines } from './head-lines'
import { parseUnifiedDiff } from './parse-unified-diff'

function parseFile(...lines: string[]): DiffFile {
  const result = parseUnifiedDiff(lines.join('\n') + '\n')
  if (!result.ok) throw new Error(result.error.message)
  return result.files[0]
}

const file = parseFile(
  '--- a/f.py',
  '+++ b/f.py',
  '@@ -10,3 +10,3 @@',
  ' line 10',
  '-old 11',
  '+line 11',
  ' line 12',
)
const contentLines = Array.from({ length: 20 }, (_, i) => `line ${String(i + 1)}`)

describe('headLines', () => {
  it('reads the range from the full content when available', () => {
    expect(headLines({ file, contentLines, start: 3, end: 4 })).toEqual(['line 3', 'line 4'])
  })

  it('falls back to the head-side lines of the hunks', () => {
    expect(headLines({ file, contentLines: null, start: 10, end: 12 })).toEqual([
      'line 10',
      'line 11',
      'line 12',
    ])
  })

  it('returns null when a line is outside the hunks and content is unavailable', () => {
    expect(headLines({ file, contentLines: null, start: 12, end: 13 })).toBeNull()
  })

  it('returns null when the range runs past the end of the content', () => {
    expect(headLines({ file, contentLines, start: 20, end: 21 })).toBeNull()
  })
})

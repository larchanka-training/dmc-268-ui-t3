import type { GapExpansion } from '../model/diff-view-store'
import type { DiffFile, DiffLine, Hunk } from '../model/types'

/** Unchanged lines that the diff does not show, before, between or after hunks. */
export interface Gap {
  index: number
  position: 'leading' | 'between' | 'trailing'
  /** First hidden line on each side. */
  oldStart: number
  newStart: number
  size: number
  /** Whether the hidden lines can be revealed (full head-side content is available). */
  expandable: boolean
  /** Section text of the hunk that follows the gap. */
  section: string
}

export interface GapRowData {
  gap: Gap
  /** Lines still hidden after the current expansion. */
  hiddenCount: number
}

export type UnifiedRow =
  { type: 'line'; key: string; line: DiffLine } | { type: 'gap'; key: string; data: GapRowData }

export type SplitRow =
  | { type: 'pair'; key: string; left: DiffLine | null; right: DiffLine | null }
  | { type: 'gap'; key: string; data: GapRowData }

export interface RowSource {
  file: DiffFile
  /** Head-side file lines, or null when the content is unavailable. */
  contentLines: string[] | null
  /** Current expansion of each gap, by gap index. */
  expansionOf: (gapIndex: number) => GapExpansion
}

/** Splits file text into lines, ignoring the final newline. */
export function toContentLines(content: string | null | undefined): string[] | null {
  if (content === null || content === undefined) return null
  const lines = content.split('\n')
  if (lines.at(-1) === '') lines.pop()
  return lines
}

function firstLine(start: number, count: number): number {
  // A side with zero lines in a hunk reports the line *before* the change.
  return count === 0 ? start + 1 : start
}

function hunkEnds(hunk: Hunk) {
  return {
    oldEnd: firstLine(hunk.oldStart, hunk.oldLines) + hunk.oldLines - 1,
    newEnd: firstLine(hunk.newStart, hunk.newLines) + hunk.newLines - 1,
  }
}

/** Gaps of a file. Without head-side content the trailing gap size is unknown and is omitted. */
export function computeGaps(file: DiffFile, contentLines: string[] | null): Gap[] {
  if (file.isBinary || file.hunks.length === 0) return []
  const expandable = contentLines !== null && file.changeType !== 'deleted'
  const gaps: Gap[] = []
  let oldEnd = 0
  let newEnd = 0
  file.hunks.forEach((hunk, index) => {
    const newFirst = firstLine(hunk.newStart, hunk.newLines)
    const size = newFirst - (newEnd + 1)
    if (size > 0) {
      gaps.push({
        index: gaps.length,
        position: index === 0 ? 'leading' : 'between',
        oldStart: oldEnd + 1,
        newStart: newEnd + 1,
        size,
        expandable,
        section: hunk.section,
      })
    }
    ;({ oldEnd, newEnd } = hunkEnds(hunk))
  })
  if (contentLines !== null && file.changeType !== 'deleted' && contentLines.length > newEnd) {
    gaps.push({
      index: gaps.length,
      position: 'trailing',
      oldStart: oldEnd + 1,
      newStart: newEnd + 1,
      size: contentLines.length - newEnd,
      expandable,
      section: '',
    })
  }
  return gaps
}

/** Clamps an expansion to the gap size. */
export function clampExpansion(gap: Gap, expansion: GapExpansion): GapExpansion {
  if (!gap.expandable) return { top: 0, bottom: 0 }
  const top = Math.min(Math.max(expansion.top, 0), gap.size)
  const bottom = Math.min(Math.max(expansion.bottom, 0), gap.size - top)
  return { top, bottom }
}

function contextLine(gap: Gap, offset: number, contentLines: string[]): DiffLine {
  const newNo = gap.newStart + offset
  return {
    kind: 'ctx',
    content: contentLines[newNo - 1] ?? '',
    oldNo: gap.oldStart + offset,
    newNo,
    expanded: true,
  }
}

function lineKey(line: DiffLine): string {
  return `${line.kind}:${String(line.oldNo)}:${String(line.newNo)}`
}

/** Rows of one gap: revealed top lines, the remaining gap (if any), revealed bottom lines. */
function gapRows(gap: Gap, source: RowSource): UnifiedRow[] {
  const { top, bottom } = clampExpansion(gap, source.expansionOf(gap.index))
  const rows: UnifiedRow[] = []
  const content = source.contentLines ?? []
  for (let offset = 0; offset < top; offset++) {
    const line = contextLine(gap, offset, content)
    rows.push({ type: 'line', key: lineKey(line), line })
  }
  const hiddenCount = gap.size - top - bottom
  if (hiddenCount > 0) {
    rows.push({ type: 'gap', key: `gap:${String(gap.index)}`, data: { gap, hiddenCount } })
  }
  for (let offset = gap.size - bottom; offset < gap.size; offset++) {
    const line = contextLine(gap, offset, content)
    rows.push({ type: 'line', key: lineKey(line), line })
  }
  return rows
}

export function buildUnifiedRows(source: RowSource): UnifiedRow[] {
  const gaps = computeGaps(source.file, source.contentLines)
  const rows: UnifiedRow[] = []
  let oldEnd = 0
  for (const hunk of source.file.hunks) {
    const before = gaps.find((gap) => gap.position !== 'trailing' && gap.oldStart === oldEnd + 1)
    if (before) rows.push(...gapRows(before, source))
    for (const line of hunk.lines) rows.push({ type: 'line', key: lineKey(line), line })
    oldEnd = hunkEnds(hunk).oldEnd
  }
  const trailing = gaps.find((gap) => gap.position === 'trailing')
  if (trailing) rows.push(...gapRows(trailing, source))
  return rows
}

/**
 * Side-by-side rows. Context lines appear on both sides; within a block of
 * changes, removed and added lines are paired in order and the shorter side
 * is padded with empty cells.
 */
export function buildSplitRows(source: RowSource): SplitRow[] {
  const rows: SplitRow[] = []
  let dels: DiffLine[] = []
  let adds: DiffLine[] = []
  const flush = () => {
    const count = Math.max(dels.length, adds.length)
    for (let i = 0; i < count; i++) {
      const left = dels.at(i) ?? null
      const right = adds.at(i) ?? null
      rows.push({
        type: 'pair',
        key: `${left ? lineKey(left) : '-'}|${right ? lineKey(right) : '-'}`,
        left,
        right,
      })
    }
    dels = []
    adds = []
  }
  for (const row of buildUnifiedRows(source)) {
    if (row.type === 'gap') {
      flush()
      rows.push(row)
    } else if (row.line.kind === 'del') {
      dels.push(row.line)
    } else if (row.line.kind === 'add') {
      adds.push(row.line)
    } else {
      flush()
      rows.push({ type: 'pair', key: row.key, left: row.line, right: row.line })
    }
  }
  flush()
  return rows
}

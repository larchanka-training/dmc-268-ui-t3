import { anchorToken, type LineAnchor, type Side } from '@/shared/lib/line-anchor'
import type { GapExpansion } from '../model/diff-view-store'
import type { DiffFile, DiffLine } from '../model/types'
import { clampExpansion, computeGaps, type Gap, type SplitRow, type UnifiedRow } from './rows'

/** LEFT anchors use the base path, RIGHT anchors the head path (they differ for renames). */
export function anchorBelongsToFile(file: DiffFile, anchor: LineAnchor): boolean {
  return anchor.side === 'LEFT' ? anchor.path === file.oldPath : anchor.path === file.newPath
}

/** Position of an anchored line inside a gap, or null when the line is not in the gap. */
function offsetInGap(gap: Gap, anchor: LineAnchor): number | null {
  const offset = anchor.line - (anchor.side === 'LEFT' ? gap.oldStart : gap.newStart)
  return offset >= 0 && offset < gap.size ? offset : null
}

/**
 * The smallest growth of a gap's expansion that reveals every anchored line in
 * it. Each line is revealed from whichever end of the gap is closer.
 */
export function expandToReveal(
  gap: Gap,
  stored: GapExpansion,
  anchors: LineAnchor[],
): GapExpansion {
  let { top, bottom } = clampExpansion(gap, stored)
  if (!gap.expandable) return { top, bottom }
  for (const anchor of anchors) {
    const offset = offsetInGap(gap, anchor)
    if (offset === null || offset < top || offset >= gap.size - bottom) continue
    const growTop = offset + 1 - top
    const growBottom = gap.size - offset - bottom
    if (growTop <= growBottom) top = offset + 1
    else bottom = gap.size - offset
  }
  return { top, bottom }
}

/** Expansion lookup that combines the user's expansion with what anchored items need. */
export function expansionsForAnchors(
  file: DiffFile,
  contentLines: string[] | null,
  stored: (gapIndex: number) => GapExpansion,
  anchors: LineAnchor[],
): (gapIndex: number) => GapExpansion {
  const relevant = anchors.filter((anchor) => anchorBelongsToFile(file, anchor))
  const gaps = computeGaps(file, contentLines)
  const result = new Map(
    gaps.map((gap) => [gap.index, expandToReveal(gap, stored(gap.index), relevant)]),
  )
  return (gapIndex) => result.get(gapIndex) ?? stored(gapIndex)
}

export type PlacedBySide<T> = Record<Side, T[]>

export interface Placement<T> {
  /** Items to show below each row, split by the side they are anchored to. */
  byRow: Map<string, PlacedBySide<T>>
  /** Items whose anchor matches no rendered line. */
  unplaced: T[]
}

function sideKey(side: Side, line: number | null): string {
  return `${side}:${String(line)}`
}

function place<T extends { anchor: LineAnchor }>(
  index: Map<string, string>,
  items: T[],
): Placement<T> {
  const byRow = new Map<string, PlacedBySide<T>>()
  const unplaced: T[] = []
  for (const item of items) {
    const rowKey = index.get(sideKey(item.anchor.side, item.anchor.line))
    if (rowKey === undefined) {
      unplaced.push(item)
      continue
    }
    const entry = byRow.get(rowKey) ?? { LEFT: [], RIGHT: [] }
    entry[item.anchor.side].push(item)
    byRow.set(rowKey, entry)
  }
  return { byRow, unplaced }
}

/** Places items (already filtered to this file) under unified rows. */
export function placeOnUnifiedRows<T extends { anchor: LineAnchor }>(
  rows: UnifiedRow[],
  items: T[],
): Placement<T> {
  const index = new Map<string, string>()
  for (const row of rows) {
    if (row.type !== 'line') continue
    if (row.line.kind !== 'add') index.set(sideKey('LEFT', row.line.oldNo), row.key)
    if (row.line.kind !== 'del') index.set(sideKey('RIGHT', row.line.newNo), row.key)
  }
  return place(index, items)
}

/** Places items (already filtered to this file) under split rows, on the column of their side. */
export function placeOnSplitRows<T extends { anchor: LineAnchor }>(
  rows: SplitRow[],
  items: T[],
): Placement<T> {
  const index = new Map<string, string>()
  for (const row of rows) {
    if (row.type !== 'pair') continue
    if (row.left) index.set(sideKey('LEFT', row.left.oldNo), row.key)
    if (row.right) index.set(sideKey('RIGHT', row.right.newNo), row.key)
  }
  return place(index, items)
}

export interface FilePaths {
  oldPath: string | null
  newPath: string | null
}

/** Anchor tokens of the lines shown in a row, for `data-anchors` (see findLineElement). */
export function rowAnchorTokens(
  paths: FilePaths,
  left: DiffLine | null,
  right: DiffLine | null,
): string {
  const tokens: string[] = []
  if (left?.oldNo != null && left.kind !== 'add' && paths.oldPath !== null) {
    tokens.push(anchorToken({ path: paths.oldPath, side: 'LEFT', line: left.oldNo }))
  }
  if (right?.newNo != null && right.kind !== 'del' && paths.newPath !== null) {
    tokens.push(anchorToken({ path: paths.newPath, side: 'RIGHT', line: right.newNo }))
  }
  return tokens.join(' ')
}

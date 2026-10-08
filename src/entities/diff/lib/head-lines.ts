import type { DiffFile } from '../model/types'

export interface HeadLinesRequest {
  file: DiffFile
  /** Head-side content lines, or null when unavailable. */
  contentLines: string[] | null
  /** First head (RIGHT) line, 1-based. */
  start: number
  /** Last head line, inclusive. */
  end: number
}

/**
 * The head-side text of lines `start`..`end`: from the full content when available,
 * otherwise from the diff's RIGHT-side lines. Null when any line in the range is unknown.
 */
export function headLines({ file, contentLines, start, end }: HeadLinesRequest): string[] | null {
  if (end < start) return null
  if (contentLines) {
    return end <= contentLines.length ? contentLines.slice(start - 1, end) : null
  }
  const byNumber = new Map<number, string>()
  for (const hunk of file.hunks) {
    for (const line of hunk.lines) {
      if (line.newNo !== null) byNumber.set(line.newNo, line.content)
    }
  }
  const lines: string[] = []
  for (let lineNo = start; lineNo <= end; lineNo++) {
    const text = byNumber.get(lineNo)
    if (text === undefined) return null
    lines.push(text)
  }
  return lines
}

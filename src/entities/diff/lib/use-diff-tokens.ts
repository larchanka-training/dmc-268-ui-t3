import { useMemo } from 'react'
import { languageFromPath, useHighlighter, type HighlightedLine } from '@/shared/lib/highlighter'
import type { DiffFile, DiffLine } from '../model/types'

export type TokensForLine = (line: DiffLine) => HighlightedLine | null

const none: TokensForLine = () => null

/** Joins the lines of one side and remembers which source line number each one has. */
function sideText(file: DiffFile, side: 'old' | 'new') {
  const numbers: number[] = []
  const text: string[] = []
  for (const hunk of file.hunks) {
    for (const line of hunk.lines) {
      const lineNo = side === 'old' ? line.oldNo : line.newNo
      if (lineNo === null) continue
      numbers.push(lineNo)
      text.push(line.content)
    }
  }
  return { numbers, code: text.join('\n') }
}

/**
 * Highlights a file per side rather than per line, so multi-line constructs
 * (block comments, template strings) are tokenized correctly. The head side
 * uses the full file when available; otherwise both sides are rebuilt from hunks.
 */
export function useDiffTokens(file: DiffFile, contentLines: string[] | null): TokensForLine {
  const highlighter = useHighlighter()
  return useMemo(() => {
    if (!highlighter || file.isBinary) return none
    const language = languageFromPath(file.newPath ?? file.oldPath ?? '')
    const tokenizeSide = (side: 'old' | 'new') => {
      if (side === 'new' && contentLines) {
        const lines = highlighter.tokenize(contentLines.join('\n'), language)
        return (lineNo: number) => lines[lineNo - 1] ?? null
      }
      const { numbers, code } = sideText(file, side)
      const lines = highlighter.tokenize(code, language)
      const byNumber = new Map(numbers.map((lineNo, index) => [lineNo, lines[index]]))
      return (lineNo: number) => byNumber.get(lineNo) ?? null
    }
    const oldSide = tokenizeSide('old')
    const newSide = tokenizeSide('new')
    return (line) => {
      if (line.kind === 'del') return line.oldNo === null ? null : oldSide(line.oldNo)
      return line.newNo === null ? null : newSide(line.newNo)
    }
  }, [highlighter, file, contentLines])
}

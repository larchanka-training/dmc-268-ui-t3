import { useEffect, useMemo, useState } from 'react'
import { getLoadedHighlighter, loadHighlighter } from './load'
import type { HighlightedLine, Highlighter } from './types'

/** The shared highlighter, or null while it loads (render plain text meanwhile). */
export function useHighlighter(): Highlighter | null {
  const [highlighter, setHighlighter] = useState(getLoadedHighlighter)
  useEffect(() => {
    if (highlighter) return
    let active = true
    loadHighlighter().then(
      (loaded) => {
        if (active) setHighlighter(loaded)
      },
      () => {
        // Highlighting is cosmetic: on failure code stays plain text.
      },
    )
    return () => {
      active = false
    }
  }, [highlighter])
  return highlighter
}

/** Tokens per line of `code`, or null until the highlighter is ready. */
export function useHighlightedLines(code: string, language: string): HighlightedLine[] | null {
  const highlighter = useHighlighter()
  return useMemo(() => highlighter?.tokenize(code, language) ?? null, [highlighter, code, language])
}

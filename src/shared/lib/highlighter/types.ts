export interface HighlightToken {
  content: string
  /** CSS custom properties with the token color per theme (--shiki-light / --shiki-dark). */
  style?: Record<string, string>
}

/** Tokens of one source line. */
export type HighlightedLine = HighlightToken[]

export interface Highlighter {
  /** Tokenizes code; returns exactly one entry per line of `code`. */
  tokenize: (code: string, language: string) => HighlightedLine[]
}

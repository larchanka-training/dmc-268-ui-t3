import type { CSSProperties } from 'react'
import type { HighlightedLine } from '@/shared/lib/highlighter'

interface CodeTokensProps {
  /** Highlighted tokens of the line, or null to render plain text. */
  tokens: HighlightedLine | null
  text: string
}

/** One line of code. Content is always rendered as React text, never as HTML. */
export function CodeTokens({ tokens, text }: CodeTokensProps) {
  if (!tokens) return <>{text}</>
  return (
    <>
      {tokens.map((token, index) => (
        <span key={index} className="code-token" style={token.style as CSSProperties | undefined}>
          {token.content}
        </span>
      ))}
    </>
  )
}

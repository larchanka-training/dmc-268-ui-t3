import { cn } from '@/shared/lib/cn'
import { useHighlightedLines } from '@/shared/lib/highlighter'
import { CodeTokens } from './code-tokens'

interface CodeBlockProps {
  code: string
  /** Language id ("typescript") or file extension ("ts"); unknown values render as plain text. */
  language: string
  /** Number of the first line. */
  startLine?: number
  /** Line numbers (in the startLine numbering) to highlight. */
  highlightLines?: readonly number[]
  className?: string
}

/** Read-only code snippet with line numbers, syntax highlighting and highlighted lines. */
export function CodeBlock({
  code,
  language,
  startLine = 1,
  highlightLines = [],
  className,
}: CodeBlockProps) {
  const tokens = useHighlightedLines(code, language)
  const lines = code.split('\n')
  return (
    <pre
      className={cn(
        'overflow-x-auto rounded-md border bg-diff-ctx py-2 font-mono text-[13px] leading-code',
        className,
      )}
    >
      <code className="grid min-w-max grid-cols-[auto_1fr]">
        {lines.map((text, index) => {
          const lineNo = startLine + index
          const highlighted = highlightLines.includes(lineNo)
          return (
            <span
              key={lineNo}
              data-line={lineNo}
              data-highlighted={highlighted || undefined}
              className={cn(
                'col-span-2 grid grid-cols-subgrid',
                highlighted && 'bg-diff-highlight',
              )}
            >
              <span
                className="select-none px-3 text-right text-muted-foreground"
                aria-hidden="true"
              >
                {lineNo}
              </span>
              <span className="whitespace-pre pr-4">
                <CodeTokens tokens={tokens?.[index] ?? null} text={text} />
              </span>
            </span>
          )
        })}
      </code>
    </pre>
  )
}

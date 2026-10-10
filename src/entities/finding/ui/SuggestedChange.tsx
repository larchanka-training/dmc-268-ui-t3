import { Check, Copy } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/shared/lib/cn'
import { useHighlightedLines, type HighlightedLine } from '@/shared/lib/highlighter'
import { Button } from '@/shared/ui/button'
import { CodeTokens } from '@/shared/ui/code-tokens'
import type { SuggestedChangeData } from '../model/schema'

interface SuggestedChangeProps {
  suggestion: SuggestedChangeData
  /** Head-side text of the suggested range, or null when it is not available. */
  originalLines: string[] | null
  /** Language id or file extension used for highlighting. */
  language: string
}

type CopyState = 'idle' | 'copied' | 'failed'

interface SuggestionLineProps {
  kind: 'del' | 'add'
  lineNo: number | null
  text: string
  tokens: HighlightedLine | null
}

function SuggestionLine({ kind, lineNo, text, tokens }: SuggestionLineProps) {
  return (
    <span
      data-kind={kind}
      className={cn(
        'col-span-3 grid grid-cols-subgrid',
        kind === 'del' ? 'bg-diff-del' : 'bg-diff-add',
      )}
    >
      <span className="select-none px-2 text-right text-muted-foreground tabular-nums">
        {lineNo}
      </span>
      <span aria-hidden="true" className="select-none text-center text-muted-foreground">
        {kind === 'del' ? '-' : '+'}
      </span>
      <span className="whitespace-pre-wrap break-all pr-4">
        <span className="sr-only">{kind === 'del' ? 'Removed line: ' : 'Added line: '}</span>
        <CodeTokens tokens={tokens} text={text} />
      </span>
    </span>
  )
}

/**
 * An AI-suggested replacement for the anchored head-side lines, shown as a small
 * −/+ diff. Code is rendered as React text, never as HTML, and nothing is applied.
 */
export function SuggestedChange({ suggestion, originalLines, language }: SuggestedChangeProps) {
  const [copyState, setCopyState] = useState<CopyState>('idle')
  const removal = suggestion.replacement === ''
  const added = removal ? [] : suggestion.replacement.split('\n')
  const originalTokens = useHighlightedLines((originalLines ?? []).join('\n'), language)
  const addedTokens = useHighlightedLines(suggestion.replacement, language)

  const copy = () => {
    // Chained so a missing Clipboard API (insecure context) also lands in the failure branch.
    void Promise.resolve()
      .then(() => navigator.clipboard.writeText(suggestion.replacement))
      .then(
        () => {
          setCopyState('copied')
        },
        () => {
          setCopyState('failed')
        },
      )
  }

  return (
    <section aria-label="Suggested change" className="space-y-1">
      <div className="flex flex-wrap items-center gap-2">
        <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Suggested change
        </h4>
        <span className="text-xs text-muted-foreground">AI suggestion · not applied</span>
        <Button variant="outline" size="xs" className="ml-auto" onClick={copy}>
          {copyState === 'copied' ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
          Copy suggestion
        </Button>
      </div>
      {removal && <p className="text-xs">This suggestion removes these lines.</p>}
      {!originalLines && (
        <p className="text-xs text-muted-foreground">
          The original lines are not available; only the suggested code is shown.
        </p>
      )}
      <pre className="overflow-x-auto rounded-md border font-mono text-[13px] leading-code">
        <code className="grid min-w-max grid-cols-[auto_1.25rem_1fr] py-1">
          {originalLines?.map((text, index) => (
            <SuggestionLine
              key={`del-${String(index)}`}
              kind="del"
              lineNo={suggestion.startLine + index}
              text={text}
              tokens={originalTokens?.[index] ?? null}
            />
          ))}
          {added.map((text, index) => (
            <SuggestionLine
              key={`add-${String(index)}`}
              kind="add"
              lineNo={null}
              text={text}
              tokens={addedTokens?.[index] ?? null}
            />
          ))}
        </code>
      </pre>
      <p role="status" className="text-xs">
        {copyState === 'copied' && 'Copied'}
      </p>
      {copyState === 'failed' && (
        <p role="alert" className="text-xs text-destructive">
          The suggestion could not be copied. Try again.
        </p>
      )}
    </section>
  )
}

import type { ReactNode } from 'react'
import { cn } from '@/shared/lib/cn'
import type { HighlightedLine } from '@/shared/lib/highlighter'
import { CodeTokens } from '@/shared/ui/code-tokens'
import { rowAnchorTokens, type FilePaths } from '../lib/anchors'
import type { DiffLine, LineKind } from '../model/types'

const KIND_LABEL: Record<LineKind, string> = {
  add: 'Added line',
  del: 'Removed line',
  ctx: 'Unchanged line',
}

const KIND_MARKER: Record<LineKind, string> = { add: '+', del: '-', ctx: ' ' }

const CODE_BG: Record<LineKind, string> = {
  add: 'bg-diff-add',
  del: 'bg-diff-del',
  ctx: 'bg-diff-ctx',
}
const GUTTER_BG: Record<LineKind, string> = {
  add: 'bg-diff-add-gutter',
  del: 'bg-diff-del-gutter',
  ctx: 'bg-diff-ctx',
}

const gutterClass = 'select-none px-2 text-right text-muted-foreground tabular-nums'
const codeClass = 'whitespace-pre-wrap break-all pr-4'

/** Column templates shared by rows and their container. */
export const UNIFIED_COLUMNS = 'grid-cols-[3.5rem_3.5rem_minmax(0,1fr)]'
export const SPLIT_COLUMNS = 'grid-cols-[3.5rem_minmax(0,1fr)_3.5rem_minmax(0,1fr)]'

interface LineNumberProps {
  value: number | null
  kind: LineKind
  /** Optional control at the cell's leading edge (e.g. a flagged-line marker). */
  marker?: ReactNode
}

function LineNumber({ value, kind, marker }: LineNumberProps) {
  return (
    <div role="cell" className={cn(gutterClass, GUTTER_BG[kind], marker != null && 'relative')}>
      {marker != null && (
        <span className="absolute inset-y-0 left-0 flex items-center">{marker}</span>
      )}
      {value}
    </div>
  )
}

function CodeCell({ line, tokens }: { line: DiffLine; tokens: HighlightedLine | null }) {
  return (
    <div role="cell" className={cn(codeClass, CODE_BG[line.kind])}>
      <span className="sr-only">{KIND_LABEL[line.kind]}: </span>
      <span
        aria-hidden="true"
        className="inline-block w-5 select-none text-center text-muted-foreground"
      >
        {KIND_MARKER[line.kind]}
      </span>
      <CodeTokens tokens={tokens} text={line.content} />
    </div>
  )
}

function FillerCells() {
  return (
    <>
      <div role="cell" className="bg-diff-filler" />
      <div role="cell" className="bg-diff-filler">
        <span className="sr-only">No line</span>
      </div>
    </>
  )
}

interface UnifiedLineRowProps {
  line: DiffLine
  tokens: HighlightedLine | null
  paths: FilePaths
  flashed: boolean
  /** Shown in the new-number gutter, or the old-number gutter for a removed line. */
  marker?: ReactNode
}

export function UnifiedLineRow({ line, tokens, paths, flashed, marker }: UnifiedLineRowProps) {
  return (
    <div
      role="row"
      data-kind={line.kind}
      data-anchors={rowAnchorTokens(paths, line, line)}
      data-flashed={flashed || undefined}
      className={cn(
        'col-span-full grid grid-cols-subgrid',
        flashed && 'outline-2 -outline-offset-2 outline-ring',
      )}
    >
      <LineNumber
        value={line.oldNo}
        kind={line.kind}
        marker={line.kind === 'del' ? marker : null}
      />
      <LineNumber
        value={line.newNo}
        kind={line.kind}
        marker={line.kind === 'del' ? null : marker}
      />
      <CodeCell line={line} tokens={tokens} />
    </div>
  )
}

interface SplitLineRowProps {
  left: DiffLine | null
  right: DiffLine | null
  tokensFor: (line: DiffLine) => HighlightedLine | null
  paths: FilePaths
  flashed: boolean
  /** Per-side markers shown in that side's line-number gutter. */
  markers?: { LEFT?: ReactNode; RIGHT?: ReactNode }
}

export function SplitLineRow({
  left,
  right,
  tokensFor,
  paths,
  flashed,
  markers,
}: SplitLineRowProps) {
  return (
    <div
      role="row"
      data-anchors={rowAnchorTokens(paths, left, right)}
      data-flashed={flashed || undefined}
      className={cn(
        'col-span-full grid grid-cols-subgrid',
        flashed && 'outline-2 -outline-offset-2 outline-ring',
      )}
    >
      {left ? (
        <>
          <LineNumber value={left.oldNo} kind={left.kind} marker={markers?.LEFT} />
          <CodeCell line={left} tokens={tokensFor(left)} />
        </>
      ) : (
        <FillerCells />
      )}
      {right ? (
        <>
          <LineNumber value={right.newNo} kind={right.kind} marker={markers?.RIGHT} />
          <CodeCell line={right} tokens={tokensFor(right)} />
        </>
      ) : (
        <FillerCells />
      )}
    </div>
  )
}

interface GapRowProps {
  hiddenCount: number
  /** Section text of the following hunk (usually the enclosing function). */
  section: string
  /** Expand controls, or a note that the lines cannot be expanded. */
  children?: ReactNode
}

export function GapRow({ hiddenCount, section, children }: GapRowProps) {
  return (
    <div
      role="row"
      className="col-span-full grid grid-cols-subgrid bg-diff-gap text-diff-gap-foreground"
    >
      <div
        role="cell"
        className="col-span-full flex flex-wrap items-center gap-x-3 gap-y-1 px-2 py-1 font-sans text-xs"
      >
        <span>
          {hiddenCount} hidden {hiddenCount === 1 ? 'line' : 'lines'}
        </span>
        {children}
        {section && <span className="truncate font-mono text-muted-foreground">{section}</span>}
      </div>
    </div>
  )
}

/** A full-width row under a diff line (used for inline findings). */
export function AttachmentRow({ children, label }: { children: ReactNode; label: string }) {
  return (
    <div role="row" aria-label={label} className="col-span-full grid grid-cols-subgrid">
      <div role="cell" className="col-span-full border-y bg-background px-3 py-2 font-sans">
        {children}
      </div>
    </div>
  )
}

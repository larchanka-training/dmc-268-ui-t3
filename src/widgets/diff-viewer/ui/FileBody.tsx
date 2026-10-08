import { Fragment, useCallback, useMemo } from 'react'
import {
  AttachmentRow,
  buildSplitRows,
  buildUnifiedRows,
  expansionsForAnchors,
  filePath,
  gapKey,
  GapRow,
  headLines,
  NO_EXPANSION,
  placeOnSplitRows,
  placeOnUnifiedRows,
  rowAnchorTokens,
  SPLIT_COLUMNS,
  SplitLineRow,
  UNIFIED_COLUMNS,
  UnifiedLineRow,
  useDiffTokens,
  useDiffViewMode,
  useExpandedGaps,
  type DiffFile,
  type GapRowData,
  type PlacedBySide,
} from '@/entities/diff'
import { sortBySeverity, useLineFlash, type Finding } from '@/entities/finding'
import { ExpandContextControls } from '@/features/expand-context'
import { cn } from '@/shared/lib/cn'
import { anchorToken, type LineAnchor } from '@/shared/lib/line-anchor'
import { FindingItem, type ResolveHeadLines } from './FindingItem'
import { FlaggedLineMarker } from './FlaggedLineMarker'

interface FileBodyProps {
  runId: string
  file: DiffFile
  /** Head-side content lines, or null when unavailable. */
  contentLines: string[] | null
  /** True while the head-side content is still loading (gaps show no controls yet). */
  contentPending?: boolean
  /** Findings anchored in this file. */
  findings: Finding[]
  onRevealLine: (anchor: LineAnchor) => void
}

export function FileBody({
  runId,
  file,
  contentLines,
  contentPending = false,
  findings,
  onRevealLine,
}: FileBodyProps) {
  const mode = useDiffViewMode()
  const expandedGaps = useExpandedGaps()
  const flash = useLineFlash()
  const tokensFor = useDiffTokens(file, contentLines)
  const path = filePath(file)
  const resolveHeadLines = useCallback<ResolveHeadLines>(
    (start, end) => headLines({ file, contentLines, start, end }),
    [file, contentLines],
  )

  const expansionOf = useMemo(
    () =>
      expansionsForAnchors(
        file,
        contentLines,
        (index) => expandedGaps[gapKey(runId, path, index)] ?? NO_EXPANSION,
        findings.map((finding) => finding.anchor),
      ),
    [file, contentLines, expandedGaps, runId, path, findings],
  )

  const view = useMemo(() => {
    const source = { file, contentLines, expansionOf }
    if (mode === 'unified') {
      const rows = buildUnifiedRows(source)
      return { mode, rows, placement: placeOnUnifiedRows(rows, findings) } as const
    }
    const rows = buildSplitRows(source)
    return { mode, rows, placement: placeOnSplitRows(rows, findings) } as const
  }, [mode, file, contentLines, expansionOf, findings])

  const flashToken = flash ? anchorToken(flash.anchor) : null
  const isFlashed = (tokens: string) =>
    flashToken !== null && tokens.split(' ').includes(flashToken)

  const renderGap = (key: string, { gap, hiddenCount }: GapRowData) => (
    <GapRow key={key} hiddenCount={hiddenCount} section={gap.section}>
      {!contentPending && (
        <ExpandContextControls
          storeKey={gapKey(runId, path, gap.index)}
          gap={gap}
          expansion={expansionOf(gap.index)}
          hiddenCount={hiddenCount}
        />
      )}
    </GapRow>
  )

  const renderFindings = (placed: PlacedBySide<Finding> | undefined) => {
    if (!placed) return null
    const item = (finding: Finding) => (
      <FindingItem
        key={finding.id}
        runId={runId}
        finding={finding}
        onRevealLine={onRevealLine}
        resolveHeadLines={resolveHeadLines}
      />
    )
    if (view.mode === 'unified') {
      return (
        <AttachmentRow label="Review findings">
          <div className="space-y-2">
            {sortBySeverity([...placed.LEFT, ...placed.RIGHT]).map(item)}
          </div>
        </AttachmentRow>
      )
    }
    return (
      <AttachmentRow label="Review findings">
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-2" data-side="LEFT">
            {sortBySeverity(placed.LEFT).map(item)}
          </div>
          <div className="space-y-2" data-side="RIGHT">
            {sortBySeverity(placed.RIGHT).map(item)}
          </div>
        </div>
      </AttachmentRow>
    )
  }

  const unifiedMarker = (placed: PlacedBySide<Finding> | undefined) => {
    const all = placed ? [...placed.LEFT, ...placed.RIGHT] : []
    return all.length > 0 ? <FlaggedLineMarker findings={all} /> : null
  }
  const splitMarkers = (placed: PlacedBySide<Finding> | undefined) =>
    placed && {
      LEFT: placed.LEFT.length > 0 ? <FlaggedLineMarker findings={placed.LEFT} /> : null,
      RIGHT: placed.RIGHT.length > 0 ? <FlaggedLineMarker findings={placed.RIGHT} /> : null,
    }

  const paths = { oldPath: file.oldPath, newPath: file.newPath }
  const unplaced = sortBySeverity(view.placement.unplaced)

  return (
    <>
      <div
        role="table"
        aria-label={`Changes in ${path}`}
        data-mode={view.mode}
        className={cn(
          'grid font-mono text-[13px] leading-code',
          view.mode === 'unified' ? UNIFIED_COLUMNS : SPLIT_COLUMNS,
        )}
      >
        {view.mode === 'unified'
          ? view.rows.map((row) =>
              row.type === 'gap' ? (
                renderGap(row.key, row.data)
              ) : (
                <Fragment key={row.key}>
                  <UnifiedLineRow
                    line={row.line}
                    tokens={tokensFor(row.line)}
                    paths={paths}
                    flashed={isFlashed(rowAnchorTokens(paths, row.line, row.line))}
                    marker={unifiedMarker(view.placement.byRow.get(row.key))}
                  />
                  {renderFindings(view.placement.byRow.get(row.key))}
                </Fragment>
              ),
            )
          : view.rows.map((row) =>
              row.type === 'gap' ? (
                renderGap(row.key, row.data)
              ) : (
                <Fragment key={row.key}>
                  <SplitLineRow
                    left={row.left}
                    right={row.right}
                    tokensFor={tokensFor}
                    paths={paths}
                    flashed={isFlashed(rowAnchorTokens(paths, row.left, row.right))}
                    markers={splitMarkers(view.placement.byRow.get(row.key))}
                  />
                  {renderFindings(view.placement.byRow.get(row.key))}
                </Fragment>
              ),
            )}
      </div>
      {unplaced.length > 0 && (
        <UnplacedFindings
          runId={runId}
          findings={unplaced}
          onRevealLine={onRevealLine}
          resolveHeadLines={resolveHeadLines}
        />
      )}
    </>
  )
}

interface UnplacedFindingsProps {
  runId: string
  findings: Finding[]
  onRevealLine: (anchor: LineAnchor) => void
  resolveHeadLines?: ResolveHeadLines
}

export function UnplacedFindings({
  runId,
  findings,
  onRevealLine,
  resolveHeadLines,
}: UnplacedFindingsProps) {
  return (
    <section aria-label="Unplaced findings" className="space-y-2 border-t bg-muted/40 p-3">
      <h3 className="text-sm font-semibold">Findings not on a shown line</h3>
      <p className="text-xs text-muted-foreground">
        These findings point to lines that are not part of this diff or its available content.
      </p>
      {findings.map((finding) => (
        <FindingItem
          key={finding.id}
          runId={runId}
          finding={finding}
          onRevealLine={onRevealLine}
          resolveHeadLines={resolveHeadLines}
        />
      ))}
    </section>
  )
}

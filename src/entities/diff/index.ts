export { DiffParseFailure, diffKeys, useFileContent, useRunDiff } from './api/queries'
export {
  anchorBelongsToFile,
  rowAnchorTokens,
  type FilePaths,
  expansionsForAnchors,
  placeOnSplitRows,
  placeOnUnifiedRows,
  type PlacedBySide,
  type Placement,
} from './lib/anchors'
export { headLines, type HeadLinesRequest } from './lib/head-lines'
export { parseUnifiedDiff } from './lib/parse-unified-diff'
export {
  buildSplitRows,
  buildUnifiedRows,
  computeGaps,
  toContentLines,
  type Gap,
  type GapRowData,
  type SplitRow,
  type UnifiedRow,
} from './lib/rows'
export {
  NO_EXPANSION,
  diffViewStore,
  gapKey,
  useDiffViewActions,
  useDiffViewMode,
  useFileCollapsed,
  useExpandedGaps,
  type DiffViewData,
  type DiffViewMode,
  type GapExpansion,
} from './model/diff-view-store'
export {
  filePath,
  type ChangeType,
  type DiffFile,
  type DiffLine,
  type Hunk,
  type LineKind,
} from './model/types'
export {
  AttachmentRow,
  GapRow,
  SPLIT_COLUMNS,
  SplitLineRow,
  UNIFIED_COLUMNS,
  UnifiedLineRow,
} from './ui/line-rows'
export { useDiffTokens, type TokensForLine } from './lib/use-diff-tokens'

export type ChangeType = 'added' | 'deleted' | 'modified' | 'renamed'
export type LineKind = 'add' | 'del' | 'ctx'

export interface DiffLine {
  kind: LineKind
  content: string
  /** Line number on the LEFT (base) side; null for added lines. */
  oldNo: number | null
  /** Line number on the RIGHT (head) side; null for removed lines. */
  newNo: number | null
  /** True for context lines revealed from a collapsed gap. */
  expanded?: boolean
}

export interface Hunk {
  oldStart: number
  oldLines: number
  newStart: number
  newLines: number
  /** Text after the closing @@, usually the enclosing function. */
  section: string
  lines: DiffLine[]
}

export interface DiffFile {
  /** Null for added files. */
  oldPath: string | null
  /** Null for deleted files. */
  newPath: string | null
  changeType: ChangeType
  isBinary: boolean
  hunks: Hunk[]
  additions: number
  deletions: number
}

export interface DiffParseError {
  message: string
  /** 1-based line in the diff text. */
  line: number
}

export type DiffParseResult = { ok: true; files: DiffFile[] } | { ok: false; error: DiffParseError }

/** Display path: the head path, or the base path for deleted files. */
export function filePath(file: DiffFile): string {
  return file.newPath ?? file.oldPath ?? ''
}

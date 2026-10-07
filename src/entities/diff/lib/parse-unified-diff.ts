import type { DiffFile, DiffLine, DiffParseResult, Hunk } from '../model/types'

const HUNK_HEADER = /^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@ ?(.*)$/

function stripPrefix(path: string): string | null {
  if (path === '/dev/null') return null
  return path.replace(/^[ab]\//, '')
}

function newFile(oldPath: string | null, newPath: string | null): DiffFile {
  return {
    oldPath,
    newPath,
    changeType: 'modified',
    isBinary: false,
    hunks: [],
    additions: 0,
    deletions: 0,
  }
}

class DiffSyntaxError extends Error {
  constructor(
    message: string,
    readonly line: number,
  ) {
    super(message)
  }
}

/**
 * Parses `git diff` / unified diff text. Fails as a whole on malformed input,
 * so callers never render a partial diff.
 */
export function parseUnifiedDiff(text: string): DiffParseResult {
  try {
    return { ok: true, files: parse(text) }
  } catch (error) {
    if (error instanceof DiffSyntaxError) {
      return { ok: false, error: { message: error.message, line: error.line } }
    }
    throw error
  }
}

function parse(text: string): DiffFile[] {
  const lines = text.split('\n').map((line) => line.replace(/\r$/, ''))
  if (lines.at(-1) === '') lines.pop()

  const files: DiffFile[] = []
  let file: DiffFile | null = null
  let hunk: Hunk | null = null
  let oldLeft = 0
  let newLeft = 0
  let oldNo = 0
  let newNo = 0

  const closeHunk = (lineNo: number) => {
    if (hunk && (oldLeft > 0 || newLeft > 0)) {
      throw new DiffSyntaxError('Hunk ended before all lines declared in its header', lineNo)
    }
    hunk = null
  }

  for (const [index, raw] of lines.entries()) {
    const lineNo = index + 1

    if (hunk && (oldLeft > 0 || newLeft > 0)) {
      const marker = raw === '' ? ' ' : raw.charAt(0)
      const content = raw.slice(1)
      let line: DiffLine
      if (marker === ' ' && oldLeft > 0 && newLeft > 0) {
        line = { kind: 'ctx', content, oldNo: oldNo++, newNo: newNo++ }
        oldLeft--
        newLeft--
      } else if (marker === '-' && oldLeft > 0) {
        line = { kind: 'del', content, oldNo: oldNo++, newNo: null }
        oldLeft--
        if (file) file.deletions++
      } else if (marker === '+' && newLeft > 0) {
        line = { kind: 'add', content, oldNo: null, newNo: newNo++ }
        newLeft--
        if (file) file.additions++
      } else if (marker === '\\') {
        continue
      } else {
        throw new DiffSyntaxError(`Unexpected line inside a hunk: "${raw.slice(0, 40)}"`, lineNo)
      }
      hunk.lines.push(line)
      continue
    }

    if (raw.startsWith('\\')) continue // "\ No newline at end of file" after the last hunk line

    if (raw.startsWith('diff --git ')) {
      closeHunk(lineNo)
      const match = /^diff --git (\S+) (\S+)$/.exec(raw)
      file = newFile(match ? stripPrefix(match[1]) : null, match ? stripPrefix(match[2]) : null)
      files.push(file)
      continue
    }

    if (raw.startsWith('@@')) {
      closeHunk(lineNo)
      const match = HUNK_HEADER.exec(raw)
      if (!match || !file) {
        throw new DiffSyntaxError(`Malformed hunk header: "${raw}"`, lineNo)
      }
      const [, oldStart, , newStart, , section] = match
      // Optional groups are undefined when the count is omitted ("@@ -3 +3 @@" means one line).
      const oldCount = match.at(2)
      const newCount = match.at(4)
      const next: Hunk = {
        oldStart: Number(oldStart),
        oldLines: oldCount === undefined ? 1 : Number(oldCount),
        newStart: Number(newStart),
        newLines: newCount === undefined ? 1 : Number(newCount),
        section: section.trim(),
        lines: [],
      }
      oldLeft = next.oldLines
      newLeft = next.newLines
      oldNo = next.oldStart
      newNo = next.newStart
      file.hunks.push(next)
      hunk = next
      continue
    }

    if (raw.startsWith('--- ')) {
      // Plain unified diffs have no "diff --git" line: "---" starts a new file.
      if (!file || file.hunks.length > 0) {
        file = newFile(null, null)
        files.push(file)
      }
      file.oldPath = stripPrefix(raw.slice(4).split('\t')[0])
      continue
    }

    if (!file) {
      if (raw.trim() === '') continue
      throw new DiffSyntaxError('Expected a file header ("diff --git" or "---")', lineNo)
    }

    if (raw.startsWith('+++ ')) {
      file.newPath = stripPrefix(raw.slice(4).split('\t')[0])
    } else if (raw.startsWith('new file mode')) {
      file.changeType = 'added'
    } else if (raw.startsWith('deleted file mode')) {
      file.changeType = 'deleted'
    } else if (raw.startsWith('rename from ')) {
      file.oldPath = raw.slice('rename from '.length)
      file.changeType = 'renamed'
    } else if (raw.startsWith('rename to ')) {
      file.newPath = raw.slice('rename to '.length)
      file.changeType = 'renamed'
    } else if (/^Binary files .* differ$/.test(raw) || raw === 'GIT binary patch') {
      file.isBinary = true
    } else if (file.hunks.length > 0) {
      throw new DiffSyntaxError(`Unexpected line after a hunk: "${raw.slice(0, 40)}"`, lineNo)
    }
    // Other extended headers (index, similarity, mode changes) carry nothing we display.
  }
  closeHunk(lines.length + 1)

  for (const item of files) {
    if (item.changeType === 'added') item.oldPath = null
    if (item.changeType === 'deleted') item.newPath = null
    if (item.changeType === 'modified') {
      if (item.oldPath === null && item.newPath !== null) item.changeType = 'added'
      else if (item.newPath === null && item.oldPath !== null) item.changeType = 'deleted'
      else if (item.oldPath !== item.newPath) item.changeType = 'renamed'
    }
  }
  return files
}

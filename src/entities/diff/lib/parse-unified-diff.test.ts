import { describe, expect, it } from 'vitest'
import { mockAppState } from '@/shared/api/mock/app-state.mock'
import type { DiffFile } from '../model/types'
import { parseUnifiedDiff } from './parse-unified-diff'

function parseOk(text: string): DiffFile[] {
  const result = parseUnifiedDiff(text)
  if (!result.ok) throw new Error(result.error.message)
  return result.files
}

const lines = (...items: string[]) => items.join('\n') + '\n'

describe('parseUnifiedDiff', () => {
  it('numbers lines inside a hunk', () => {
    const [file] = parseOk(
      lines(
        'diff --git a/a.ts b/a.ts',
        '--- a/a.ts',
        '+++ b/a.ts',
        '@@ -10,3 +10,4 @@ function demo() {',
        ' keep',
        '-old',
        '+new 1',
        '+new 2',
        ' keep',
      ),
    )
    const numbers = file.hunks[0].lines.map((line) => [line.kind, line.oldNo, line.newNo])
    expect(numbers).toEqual([
      ['ctx', 10, 10],
      ['del', 11, null],
      ['add', null, 11],
      ['add', null, 12],
      ['ctx', 12, 13],
    ])
    expect(file).toMatchObject({ changeType: 'modified', additions: 2, deletions: 1 })
    expect(file.hunks[0].section).toBe('function demo() {')
  })

  it('reads added, deleted and renamed files', () => {
    const files = parseOk(
      lines(
        'diff --git a/new.ts b/new.ts',
        'new file mode 100644',
        '--- /dev/null',
        '+++ b/new.ts',
        '@@ -0,0 +1 @@',
        '+hello',
        'diff --git a/gone.ts b/gone.ts',
        'deleted file mode 100644',
        '--- a/gone.ts',
        '+++ /dev/null',
        '@@ -1 +0,0 @@',
        '-bye',
        'diff --git a/a.ts b/b.ts',
        'similarity index 90%',
        'rename from a.ts',
        'rename to b.ts',
      ),
    )
    expect(files.map((file) => [file.changeType, file.oldPath, file.newPath])).toEqual([
      ['added', null, 'new.ts'],
      ['deleted', 'gone.ts', null],
      ['renamed', 'a.ts', 'b.ts'],
    ])
    expect(files[2].hunks).toEqual([])
  })

  it('marks binary files without hunks', () => {
    const [file] = parseOk(
      lines(
        'diff --git a/logo.png b/logo.png',
        'index 1..2 100644',
        'Binary files a/logo.png and b/logo.png differ',
      ),
    )
    expect(file).toMatchObject({ isBinary: true, hunks: [] })
  })

  it('parses several hunks and skips "no newline" markers', () => {
    const [file] = parseOk(
      lines(
        '--- a/a.ts',
        '+++ b/a.ts',
        '@@ -1,2 +1,2 @@',
        ' one',
        '-two',
        '\\ No newline at end of file',
        '+two!',
        '@@ -20 +20 @@',
        '-x',
        '+y',
        '\\ No newline at end of file',
      ),
    )
    expect(file.hunks).toHaveLength(2)
    expect(file.hunks[0].lines.map((line) => line.content)).toEqual(['one', 'two', 'two!'])
    expect(file.hunks[1]).toMatchObject({ oldStart: 20, oldLines: 1, newStart: 20, newLines: 1 })
  })

  it('fails on a malformed hunk header', () => {
    const result = parseUnifiedDiff(lines('--- a/a.ts', '+++ b/a.ts', '@@ -1,x +1 @@', ' a'))
    expect(result).toEqual({ ok: false, error: expect.objectContaining({ line: 3 }) as unknown })
  })

  it('fails when a hunk is shorter than its header declares', () => {
    const result = parseUnifiedDiff(lines('--- a/a.ts', '+++ b/a.ts', '@@ -1,3 +1,3 @@', ' a'))
    expect(result.ok).toBe(false)
  })

  it('fails on text that is not a diff', () => {
    expect(parseUnifiedDiff('hello world').ok).toBe(false)
  })

  it('returns no files for an empty diff', () => {
    expect(parseUnifiedDiff('')).toEqual({ ok: true, files: [] })
  })

  it('parses the mock fixture', () => {
    const files = parseOk(mockAppState.server.diffText)
    expect(files.map((file) => [file.changeType, file.newPath ?? file.oldPath])).toEqual([
      ['modified', 'assets/logo.png'],
      ['modified', 'config/settings.py'],
      ['added', 'src/api/search-endpoint.ts'],
      ['deleted', 'src/legacy/old-helper.js'],
      ['modified', 'src/services/user-service.ts'],
      ['renamed', 'src/utils/formatting.ts'],
    ])
  })
})

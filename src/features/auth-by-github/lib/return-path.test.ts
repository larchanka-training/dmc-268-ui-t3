import { describe, expect, it } from 'vitest'
import { safeReturnPath } from './return-path'

const ORIGIN = 'https://review.example.com'

describe('safeReturnPath', () => {
  it('keeps a same-origin path with query and hash', () => {
    expect(safeReturnPath('/?run=abc#finding-1', ORIGIN)).toBe('/?run=abc#finding-1')
  })

  it.each([
    ['an absolute external URL', 'https://evil.example.com/'],
    ['a protocol-relative URL', '//evil.example.com/'],
    ['a backslash trick', '/\\evil.example.com'],
    ['a relative path', 'run/abc'],
    ['the callback itself', '/auth/callback?code=x'],
  ])('falls back to / for %s', (_label, path) => {
    expect(safeReturnPath(path, ORIGIN)).toBe('/')
  })
})

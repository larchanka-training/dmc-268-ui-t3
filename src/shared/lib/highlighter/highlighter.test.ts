import { describe, expect, it, vi } from 'vitest'
import { languageFromPath, resolveLanguage } from './language'

// The test setup stubs the loader for component tests; this file needs the real one.
vi.unmock('@/shared/lib/highlighter/load')

describe('languageFromPath', () => {
  it.each([
    ['src/a.ts', 'typescript'],
    ['src/App.TSX', 'tsx'],
    ['config/settings.py', 'python'],
    ['ci.yml', 'yaml'],
    ['Makefile', 'text'],
    ['notes.unknownext', 'text'],
    ['.gitignore', 'text'],
  ])('%s → %s', (path, language) => {
    expect(languageFromPath(path)).toBe(language)
  })

  it('accepts ids and extensions', () => {
    expect(resolveLanguage('python')).toBe('python')
    expect(resolveLanguage('ts')).toBe('typescript')
    expect(resolveLanguage('cobol')).toBe('text')
  })
})

describe('loadHighlighter', () => {
  it('colors tokens and maps multi-line comments to the right lines', async () => {
    const { loadHighlighter } = await import('./load')
    const highlighter = await loadHighlighter()
    const lines = highlighter.tokenize(
      'const a = 1 /* start\nstill comment */\nlet b',
      'typescript',
    )
    expect(lines).toHaveLength(3)
    const keyword = lines[0].find((token) => token.content === 'const')
    expect(keyword?.style?.['--shiki-light']).toMatch(/^#/)
    const commentColor = lines[0].find((token) => token.content.includes('start'))?.style?.[
      '--shiki-light'
    ]
    expect(lines[1][0].style?.['--shiki-light']).toBe(commentColor)
    expect(lines[2].map((token) => token.content).join('')).toBe('let b')
  })

  it('returns plain lines for unknown languages', async () => {
    const { loadHighlighter } = await import('./load')
    const highlighter = await loadHighlighter()
    expect(highlighter.tokenize('a\nb', 'text')).toEqual([[{ content: 'a' }], [{ content: 'b' }]])
  })
})

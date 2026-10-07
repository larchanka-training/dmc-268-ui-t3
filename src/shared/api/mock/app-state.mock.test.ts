import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const read = (path: string) => readFileSync(new URL(path, import.meta.url), 'utf8')

/** The fenced code between the mock-state markers of FRONTEND_ARCHITECTURE.md. */
function documentedMockState(markdown: string): string | null {
  const match = /<!-- mock-state:start -->\s*```ts\n([\s\S]*?)\n```\s*<!-- mock-state:end -->/.exec(
    markdown,
  )
  return match ? match[1] : null
}

describe('FRONTEND_ARCHITECTURE.md', () => {
  it('embeds the current mock application state verbatim', () => {
    const documented = documentedMockState(read('../../../../FRONTEND_ARCHITECTURE.md'))
    const source = read('./app-state.mock.ts').trimEnd()
    expect(documented, 'mock-state block not found in FRONTEND_ARCHITECTURE.md').not.toBeNull()
    expect(documented).toBe(source)
  })
})

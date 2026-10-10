import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, vi } from 'vitest'

// Syntax highlighting loads asynchronously; component tests render the plain-text
// fallback for deterministic output. Highlighter tests opt out with vi.unmock.
vi.mock('@/shared/lib/highlighter/load', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/shared/lib/highlighter/load')>()
  return {
    ...actual,
    getLoadedHighlighter: () => null,
    loadHighlighter: () => new Promise(() => undefined),
  }
})

// jsdom does not implement scrolling.
Element.prototype.scrollIntoView = vi.fn()

afterEach(() => {
  cleanup()
})

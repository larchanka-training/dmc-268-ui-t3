import { beforeEach, describe, expect, it } from 'vitest'
import { createSidebarStore, SIDEBAR_STORAGE_KEY } from './sidebar-store'

describe('sidebar store', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('starts expanded', () => {
    expect(createSidebarStore().getState().collapsed).toBe(false)
  })

  it('keeps the collapsed choice across a reload', () => {
    const store = createSidebarStore()
    store.getState().toggleCollapsed()
    expect(localStorage.getItem(SIDEBAR_STORAGE_KEY)).toBe('collapsed')
    expect(createSidebarStore().getState().collapsed).toBe(true)

    store.getState().toggleCollapsed()
    expect(createSidebarStore().getState().collapsed).toBe(false)
  })

  it('starts expanded and still toggles when storage throws', () => {
    const store = createSidebarStore(() => {
      throw new DOMException('denied', 'SecurityError')
    })
    expect(store.getState().collapsed).toBe(false)
    store.getState().toggleCollapsed()
    expect(store.getState().collapsed).toBe(true)
  })
})

import { beforeEach, describe, expect, it } from 'vitest'
import { applyTheme, readStoredTheme, THEME_STORAGE_KEY, themeStore } from './theme'

const root = document.documentElement

describe('theme', () => {
  beforeEach(() => {
    localStorage.clear()
    root.removeAttribute('data-theme')
  })

  it('defaults to system when nothing is stored', () => {
    expect(readStoredTheme()).toBe('system')
  })

  it('falls back to system for an unknown stored value', () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'sepia')
    expect(readStoredTheme()).toBe('system')
  })

  it('falls back to system when storage throws', () => {
    expect(
      readStoredTheme(() => {
        throw new DOMException('denied', 'SecurityError')
      }),
    ).toBe('system')
  })

  it('sets data-theme for light and dark and removes it for system', () => {
    applyTheme('dark')
    expect(root).toHaveAttribute('data-theme', 'dark')
    applyTheme('light')
    expect(root).toHaveAttribute('data-theme', 'light')
    applyTheme('system')
    expect(root).not.toHaveAttribute('data-theme')
  })

  it('persists and applies a chosen preference', () => {
    themeStore.getState().setPreference('dark')
    expect(themeStore.getState().preference).toBe('dark')
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark')
    expect(root).toHaveAttribute('data-theme', 'dark')
  })

  it('restores the stored preference on init, as after a reload', () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'light')
    themeStore.getState().init()
    expect(themeStore.getState().preference).toBe('light')
    expect(root).toHaveAttribute('data-theme', 'light')
  })
})

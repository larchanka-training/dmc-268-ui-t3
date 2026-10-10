import { useStore } from 'zustand'
import { createStore } from 'zustand/vanilla'

/**
 * Color theme preference. The CSS in app/styles/index.css owns the themes:
 * `<html data-theme="light|dark">` forces one, and no attribute follows the OS
 * through prefers-color-scheme. So `system` needs no JS listener.
 */
export const THEME_PREFERENCES = ['light', 'dark', 'system'] as const
export type ThemePreference = (typeof THEME_PREFERENCES)[number]

/** Also read by the pre-paint script in index.html; a test keeps them equal. */
export const THEME_STORAGE_KEY = 'dmc268.theme'

function isPreference(value: unknown): value is ThemePreference {
  return THEME_PREFERENCES.includes(value as ThemePreference)
}

/** Stored preference, or `system` when it is missing, unknown, or storage is unusable. */
export function readStoredTheme(storage: () => Storage = () => localStorage): ThemePreference {
  try {
    const value = storage().getItem(THEME_STORAGE_KEY)
    return isPreference(value) ? value : 'system'
  } catch {
    return 'system'
  }
}

function writeStoredTheme(preference: ThemePreference): void {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, preference)
  } catch {
    // Private mode or blocked storage: the choice lasts for this page only.
  }
}

export function applyTheme(
  preference: ThemePreference,
  root: HTMLElement = document.documentElement,
) {
  if (preference === 'system') root.removeAttribute('data-theme')
  else root.setAttribute('data-theme', preference)
}

interface ThemeState {
  preference: ThemePreference
  setPreference: (preference: ThemePreference) => void
  /** Re-reads storage and applies it; called once at startup and by tests. */
  init: () => void
}

export const themeStore = createStore<ThemeState>()((set) => ({
  preference: 'system',
  setPreference: (preference) => {
    writeStoredTheme(preference)
    applyTheme(preference)
    set({ preference })
  },
  init: () => {
    const preference = readStoredTheme()
    applyTheme(preference)
    set({ preference })
  },
}))

export const useThemePreference = () => useStore(themeStore, (state) => state.preference)

export const useSetThemePreference = () => useStore(themeStore, (state) => state.setPreference)

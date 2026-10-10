import { useStore } from 'zustand'
import { createStore } from 'zustand/vanilla'

export const SIDEBAR_STORAGE_KEY = 'dmc268.sidebar'

interface SidebarState {
  /** Desktop only: icon rail instead of the full sidebar. */
  collapsed: boolean
  toggleCollapsed: () => void
}

/** Creates the store from storage; exported so tests can simulate a reload. */
export function createSidebarStore(storage: () => Storage = () => localStorage) {
  let initial = false
  try {
    initial = storage().getItem(SIDEBAR_STORAGE_KEY) === 'collapsed'
  } catch {
    // Unusable storage: start expanded.
  }
  return createStore<SidebarState>()((set, get) => ({
    collapsed: initial,
    toggleCollapsed: () => {
      const collapsed = !get().collapsed
      try {
        storage().setItem(SIDEBAR_STORAGE_KEY, collapsed ? 'collapsed' : 'expanded')
      } catch {
        // The choice lasts for this page only.
      }
      set({ collapsed })
    },
  }))
}

export const sidebarStore = createSidebarStore()

export const useSidebarCollapsed = () => useStore(sidebarStore, (state) => state.collapsed)

export const useToggleSidebar = () => useStore(sidebarStore, (state) => state.toggleCollapsed)

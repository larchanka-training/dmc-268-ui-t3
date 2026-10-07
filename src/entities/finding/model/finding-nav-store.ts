import { useStore } from 'zustand'
import { createStore } from 'zustand/vanilla'
import type { LineAnchor } from '@/shared/lib/line-anchor'

export interface FindingNavData {
  selectedFindingId: string | null
}

/** A diff line that should be briefly highlighted after navigation. */
export interface LineFlash {
  anchor: LineAnchor
  /** Distinguishes repeated flashes of the same line. */
  token: number
}

interface FindingNavState extends FindingNavData {
  flash: LineFlash | null
  actions: {
    selectFinding: (findingId: string | null) => void
    flashLine: (anchor: LineAnchor) => void
    clearFlash: (token: number) => void
    reset: () => void
  }
}

let flashCounter = 0

export const findingNavStore = createStore<FindingNavState>()((set) => ({
  selectedFindingId: null,
  flash: null,
  actions: {
    selectFinding: (selectedFindingId) => {
      set({ selectedFindingId })
    },
    flashLine: (anchor) => {
      flashCounter += 1
      set({ flash: { anchor, token: flashCounter } })
    },
    clearFlash: (token) => {
      set((state) => (state.flash?.token === token ? { flash: null } : state))
    },
    reset: () => {
      set({ selectedFindingId: null, flash: null })
    },
  },
}))

export const useSelectedFindingId = () =>
  useStore(findingNavStore, (state) => state.selectedFindingId)

export const useLineFlash = () => useStore(findingNavStore, (state) => state.flash)

export const useFindingNavActions = () => useStore(findingNavStore, (state) => state.actions)

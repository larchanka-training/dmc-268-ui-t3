import { useStore } from 'zustand'
import { createStore } from 'zustand/vanilla'

export type DiffViewMode = 'unified' | 'split'

/** Context lines revealed at the top and bottom of a collapsed gap. */
export interface GapExpansion {
  top: number
  bottom: number
}

export interface DiffViewData {
  mode: DiffViewMode
  /** Explicit per-file collapse choices; files not listed use their default. */
  fileCollapse: Record<string, boolean>
  /** Keyed by gapKey(runId, path, gapIndex). */
  expandedGaps: Record<string, GapExpansion>
}

interface DiffViewState extends DiffViewData {
  runId: string | null
  actions: {
    /** Clears per-run state (collapse, expansion) when another run is opened. Keeps the view mode. */
    syncRun: (runId: string) => void
    setMode: (mode: DiffViewMode) => void
    setFileCollapsed: (path: string, collapsed: boolean) => void
    setGapExpansion: (key: string, expansion: GapExpansion) => void
    reset: () => void
  }
}

export const NO_EXPANSION: GapExpansion = { top: 0, bottom: 0 }

const initialData: DiffViewData & { runId: string | null } = {
  runId: null,
  mode: 'unified',
  fileCollapse: {},
  expandedGaps: {},
}

export function gapKey(runId: string, path: string, gapIndex: number): string {
  return `${runId}:${path}:${String(gapIndex)}`
}

export const diffViewStore = createStore<DiffViewState>()((set) => ({
  ...initialData,
  actions: {
    syncRun: (runId) => {
      set((state) =>
        state.runId === runId ? state : { runId, fileCollapse: {}, expandedGaps: {} },
      )
    },
    setMode: (mode) => {
      set({ mode })
    },
    setFileCollapsed: (path, collapsed) => {
      set((state) => ({ fileCollapse: { ...state.fileCollapse, [path]: collapsed } }))
    },
    setGapExpansion: (key, expansion) => {
      set((state) => ({ expandedGaps: { ...state.expandedGaps, [key]: expansion } }))
    },
    reset: () => {
      set(initialData)
    },
  },
}))

export const useDiffViewMode = () => useStore(diffViewStore, (state) => state.mode)

export const useFileCollapsed = (path: string, collapsedByDefault: boolean) =>
  useStore(diffViewStore, (state) => state.fileCollapse[path] ?? collapsedByDefault)

export const useExpandedGaps = () => useStore(diffViewStore, (state) => state.expandedGaps)

export const useDiffViewActions = () => useStore(diffViewStore, (state) => state.actions)

import { beforeEach, describe, expect, it } from 'vitest'
import { mockAppState } from '@/shared/api/mock/app-state.mock'
import { diffViewStore, gapKey, type DiffViewData } from './diff-view-store'

const actions = () => diffViewStore.getState().actions

describe('diffViewStore', () => {
  beforeEach(() => {
    actions().reset()
  })

  it('switches the view mode', () => {
    actions().setMode('split')
    expect(diffViewStore.getState().mode).toBe('split')
  })

  it('records file collapse choices', () => {
    actions().setFileCollapsed('a.ts', true)
    expect(diffViewStore.getState().fileCollapse).toEqual({ 'a.ts': true })
  })

  it('stores gap expansions by key', () => {
    const key = gapKey('run-1', 'a.ts', 0)
    actions().setGapExpansion(key, { top: 20, bottom: 0 })
    actions().setGapExpansion(key, { top: 40, bottom: 5 })
    expect(diffViewStore.getState().expandedGaps).toEqual({ [key]: { top: 40, bottom: 5 } })
  })

  it('resets per-run state but keeps the mode when the run changes', () => {
    actions().syncRun('run-1')
    actions().setMode('split')
    actions().setFileCollapsed('a.ts', true)
    actions().setGapExpansion(gapKey('run-1', 'a.ts', 0), { top: 20, bottom: 0 })
    actions().syncRun('run-1')
    expect(diffViewStore.getState().fileCollapse).toEqual({ 'a.ts': true })
    actions().syncRun('run-2')
    expect(diffViewStore.getState()).toMatchObject({
      runId: 'run-2',
      mode: 'split',
      fileCollapse: {},
      expandedGaps: {},
    })
  })

  it('accepts the documented mock client state', () => {
    const data: DiffViewData = mockAppState.client.diffView
    expect(data.mode).toBe('unified')
  })
})

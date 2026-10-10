import { beforeEach, describe, expect, it } from 'vitest'
import { mockAppState } from '@/shared/api/mock/app-state.mock'
import { findingNavStore, type FindingNavData } from './finding-nav-store'

const actions = () => findingNavStore.getState().actions
const anchor = { path: 'a.ts', side: 'RIGHT', line: 3 } as const

describe('findingNavStore', () => {
  beforeEach(() => {
    actions().reset()
  })

  it('selects a finding', () => {
    actions().selectFinding('f-1')
    expect(findingNavStore.getState().selectedFindingId).toBe('f-1')
  })

  it('clears a flash only with the matching token', () => {
    actions().flashLine(anchor)
    const first = findingNavStore.getState().flash
    actions().flashLine(anchor)
    const second = findingNavStore.getState().flash
    expect(second?.token).not.toBe(first?.token)
    actions().clearFlash(first?.token ?? -1)
    expect(findingNavStore.getState().flash).toEqual(second)
    actions().clearFlash(second?.token ?? -1)
    expect(findingNavStore.getState().flash).toBeNull()
  })

  it('resets', () => {
    actions().selectFinding('f-1')
    actions().flashLine(anchor)
    actions().reset()
    expect(findingNavStore.getState()).toMatchObject({ selectedFindingId: null, flash: null })
  })

  it('accepts the documented mock client state', () => {
    const data: FindingNavData = mockAppState.client.findingNav
    expect(data.selectedFindingId).toBeNull()
  })
})

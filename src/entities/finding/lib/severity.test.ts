import { describe, expect, it } from 'vitest'
import type { Severity } from '../model/schema'
import { countByGroup, GROUP_LABEL, highestGroup, severityGroup, sortBySeverity } from './severity'

const of = (...levels: Severity[]) => levels.map((severity) => ({ severity }))

describe('severity display groups', () => {
  it('re-exports the shared display groups', () => {
    expect(severityGroup('medium')).toBe('warning')
    expect(GROUP_LABEL.info).toBe('Info')
  })

  it('counts findings by group', () => {
    expect(countByGroup(of('critical', 'high', 'high', 'medium', 'low'))).toEqual({
      critical: 1,
      warning: 3,
      info: 1,
    })
  })

  it('finds the highest group', () => {
    expect(highestGroup(of('low', 'critical'))).toBe('critical')
    expect(highestGroup(of('low', 'medium'))).toBe('warning')
    expect(highestGroup(of('low'))).toBe('info')
    expect(highestGroup([])).toBeNull()
  })

  it('keeps ordering by level inside a group', () => {
    expect(sortBySeverity(of('medium', 'high')).map((f) => f.severity)).toEqual(['high', 'medium'])
  })
})

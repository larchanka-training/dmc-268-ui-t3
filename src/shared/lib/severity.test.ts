import { describe, expect, it } from 'vitest'
import { GROUP_LABEL, SEVERITIES, severityGroup } from './severity'

describe('severity display groups', () => {
  it('maps levels to groups', () => {
    expect(SEVERITIES.map(severityGroup)).toEqual(['critical', 'warning', 'warning', 'info'])
    expect(GROUP_LABEL).toEqual({ critical: 'Critical', warning: 'Warning', info: 'Info' })
  })
})

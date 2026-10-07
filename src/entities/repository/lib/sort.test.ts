import { describe, expect, it } from 'vitest'
import { sortByFullName } from './sort'

describe('sortByFullName', () => {
  it('sorts case-insensitively without changing the input', () => {
    const input = [{ fullName: 'acme/web' }, { fullName: 'Acme/Docs' }, { fullName: 'acme/api' }]
    expect(sortByFullName(input).map((item) => item.fullName)).toEqual([
      'acme/api',
      'Acme/Docs',
      'acme/web',
    ])
    expect(input[0].fullName).toBe('acme/web')
  })
})

import { describe, expect, it } from 'vitest'
import { ZodError } from 'zod'
import { ApiError } from '@/shared/api'
import { formatBranchFilter, parseBranchFilter } from './branch-filter'
import { describeSaveError } from './describe-error'

describe('parseBranchFilter', () => {
  it('trims lines and drops empty ones', () => {
    expect(parseBranchFilter('main\n\n  develop  \n')).toEqual({
      patterns: ['main', 'develop'],
      problems: [],
    })
    expect(parseBranchFilter('  \n')).toEqual({ patterns: [], problems: [] })
  })

  it('reports a pattern with whitespace', () => {
    expect(parseBranchFilter('feature x').problems).toEqual(['“feature x” contains whitespace.'])
  })

  it('reports a pattern longer than 255 characters', () => {
    const long = 'a'.repeat(256)
    expect(parseBranchFilter(long).problems).toEqual([
      `“${'a'.repeat(40)}…” is longer than 255 characters.`,
    ])
    expect(parseBranchFilter('a'.repeat(255)).problems).toEqual([])
  })

  it('reports a repeated pattern once', () => {
    expect(parseBranchFilter('main\nmain\n main').problems).toEqual(['“main” is repeated.'])
  })

  it('round-trips the saved patterns', () => {
    expect(parseBranchFilter(formatBranchFilter(['main', 'release/*'])).patterns).toEqual([
      'main',
      'release/*',
    ])
  })
})

describe('describeSaveError', () => {
  it('explains a rejection', () => {
    expect(describeSaveError(new ApiError('nope <b>body</b>', 422))).toBe(
      'The server rejected these settings. Check the branch filter and try again.',
    )
  })

  it.each([new ApiError('boom', 500), new ZodError([]), new Error('x')])(
    'is generic for %s',
    (error) => {
      expect(describeSaveError(error)).toBe('The settings could not be saved. Try again.')
    },
  )
})

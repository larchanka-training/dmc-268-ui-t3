import { describe, expect, it } from 'vitest'
import type { ReviewRunWire } from '@/shared/api'
import { mockAppState } from '@/shared/api/mock/app-state.mock'
import { reviewRunSchema } from './schema'

const base: ReviewRunWire = {
  ...mockAppState.server.run,
  author: undefined,
  base_branch: undefined,
  head_branch: undefined,
  pull_request_url: undefined,
}

describe('reviewRunSchema pull request metadata', () => {
  it('accepts a payload without the metadata and normalizes it to null', () => {
    const run = reviewRunSchema.parse(base)
    expect(run.author).toBeNull()
    expect(run.baseBranch).toBeNull()
    expect(run.headBranch).toBeNull()
    expect(run.pullRequestUrl).toBeNull()
  })

  it('maps full metadata to the view model', () => {
    const run = reviewRunSchema.parse({
      ...base,
      author: { login: 'octocat', avatar_url: 'https://avatars.example.com/u/1' },
      base_branch: 'main',
      head_branch: 'feature/search',
      pull_request_url: 'https://github.com/acme/web/pull/42',
    })
    expect(run.author).toEqual({ login: 'octocat', avatarUrl: 'https://avatars.example.com/u/1' })
    expect(run.baseBranch).toBe('main')
    expect(run.headBranch).toBe('feature/search')
    expect(run.pullRequestUrl).toBe('https://github.com/acme/web/pull/42')
  })

  it('accepts an author without an avatar', () => {
    const run = reviewRunSchema.parse({ ...base, author: { login: 'octocat', avatar_url: null } })
    expect(run.author).toEqual({ login: 'octocat', avatarUrl: null })
  })

  it.each(['javascript:alert(1)', 'http://github.com/acme/web/pull/42', '/pull/42'])(
    'rejects the pull request URL %j',
    (url) => {
      expect(reviewRunSchema.safeParse({ ...base, pull_request_url: url }).success).toBe(false)
    },
  )

  it('rejects an avatar URL that is not https', () => {
    const author = { login: 'octocat', avatar_url: 'javascript:alert(1)' }
    expect(reviewRunSchema.safeParse({ ...base, author }).success).toBe(false)
  })
})

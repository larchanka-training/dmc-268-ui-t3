import { describe, expect, it } from 'vitest'
import { mockRepositoryState } from '@/shared/api/mock/repositories.mock'
import { availableRepositorySchema, repositoryListSchema, repositorySchema } from './schema'

const [connected] = mockRepositoryState.connected
const available = mockRepositoryState.available

describe('repositorySchema', () => {
  it('maps the wire payload to the view model', () => {
    expect(repositorySchema.parse(connected)).toEqual({
      id: 'repo-1',
      provider: 'github',
      externalId: '810000001',
      fullName: 'acme/web',
      url: 'https://github.com/acme/web',
      defaultBranch: 'main',
      isPrivate: false,
      connectedAt: '2026-10-01T09:30:00Z',
    })
  })

  it.each(['javascript:alert(1)', 'http://github.com/acme/web', '/acme/web', 'not a url'])(
    'rejects the URL %j',
    (url) => {
      expect(repositorySchema.safeParse({ ...connected, url }).success).toBe(false)
    },
  )

  it('rejects an unknown provider', () => {
    expect(repositorySchema.safeParse({ ...connected, provider: 'bitbucket' }).success).toBe(false)
  })

  it('rejects the whole list when one entry is invalid', () => {
    const result = repositoryListSchema.safeParse([connected, { ...connected, full_name: '' }])
    expect(result.success).toBe(false)
  })
})

describe('availableRepositorySchema', () => {
  it('derives isConnected from repository_id', () => {
    expect(availableRepositorySchema.parse(available[0])).toMatchObject({ isConnected: true })
    expect(availableRepositorySchema.parse(available[2])).toEqual({
      provider: 'github',
      externalId: '810000003',
      fullName: 'acme/docs',
      url: 'https://github.com/acme/docs',
      defaultBranch: 'main',
      isPrivate: false,
      isConnected: false,
    })
  })

  it('rejects a missing repository_id field', () => {
    const payload: Record<string, unknown> = { ...available[2] }
    delete payload.repository_id
    expect(availableRepositorySchema.safeParse(payload).success).toBe(false)
  })
})

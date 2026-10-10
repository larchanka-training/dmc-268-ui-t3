import { describe, expect, it } from 'vitest'
import { mockRepositoryState } from '@/shared/api/mock/repositories.mock'
import { repositoryRulesSchema } from './schema'

const { 'repo-1': custom, 'repo-2': missing, 'repo-3': invalid } = mockRepositoryState.rules

describe('repositoryRulesSchema', () => {
  it('maps custom rules to the view model', () => {
    const parsed = repositoryRulesSchema.parse(custom)
    expect(parsed).toMatchObject({
      status: 'custom',
      branch: 'main',
      commitSha: custom.commit_sha,
      fileUrl: 'https://github.com/acme/web/blob/main/.review/rules.md',
      rulesVersion: 'rules-2026-10-02',
      problems: [],
    })
    expect(parsed.rules.map((rule) => rule.id)).toEqual(['SEC-001', 'A11Y-002', 'STY-004'])
    expect(parsed.rules[2]).toMatchObject({ severity: 'low', enabled: false })
  })

  it('accepts a missing file without commit or link', () => {
    expect(repositoryRulesSchema.parse(missing)).toMatchObject({
      status: 'missing',
      commitSha: null,
      fileUrl: null,
    })
  })

  it('accepts an invalid file with its problems', () => {
    expect(repositoryRulesSchema.parse(invalid).problems).toEqual([
      { message: 'Unknown severity `urgent`', line: 12 },
      { message: 'Missing rule ID', line: null },
    ])
  })

  it('rejects an unsafe file URL', () => {
    expect(
      repositoryRulesSchema.safeParse({ ...custom, file_url: 'javascript:alert(1)' }).success,
    ).toBe(false)
  })

  it('rejects an unknown status or severity', () => {
    expect(repositoryRulesSchema.safeParse({ ...custom, status: 'stale' }).success).toBe(false)
    expect(
      repositoryRulesSchema.safeParse({
        ...custom,
        rules: [{ ...custom.rules[0], severity: 'urgent' }],
      }).success,
    ).toBe(false)
  })

  it.each([
    ['a missing file with a commit', { ...missing, commit_sha: custom.commit_sha }],
    ['a missing file with a link', { ...missing, file_url: custom.file_url }],
    ['custom rules without a commit', { ...custom, commit_sha: null }],
    ['custom rules with problems', { ...custom, problems: invalid.problems }],
    ['an invalid file without problems', { ...invalid, problems: [] }],
  ])('rejects %s', (_, payload) => {
    expect(repositoryRulesSchema.safeParse(payload).success).toBe(false)
  })
})

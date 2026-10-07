import { describe, expect, it } from 'vitest'
import { ApiError } from '../review-api'
import { mockAppState, RUN_ID } from './app-state.mock'
import { createMockReviewApi, failuresFromSearch } from './mock-review-api'
import { mockRepositoryState } from './repositories.mock'

describe('createMockReviewApi', () => {
  it('returns the fixture data', async () => {
    const api = createMockReviewApi()
    await expect(api.getRun(RUN_ID)).resolves.toEqual(mockAppState.server.run)
    await expect(api.getDiff(RUN_ID)).resolves.toBe(mockAppState.server.diffText)
    await expect(api.getFindings(RUN_ID)).resolves.toEqual(mockAppState.server.findings)
    await expect(
      api.getFileContent({ runId: RUN_ID, path: 'config/settings.py' }),
    ).resolves.toBeNull()
  })

  it('lists the fixture run', async () => {
    await expect(createMockReviewApi().listRuns()).resolves.toEqual([mockAppState.server.run])
  })

  it('lists the runs of the injected state', async () => {
    const run = { ...mockAppState.server.run, run_id: 'run-x' }
    const api = createMockReviewApi({ state: { ...mockAppState.server, run } })
    await expect(api.listRuns()).resolves.toEqual([run])
  })

  it('rejects an unknown run with a 404', async () => {
    const api = createMockReviewApi()
    await expect(api.getRun('missing')).rejects.toMatchObject({ status: 404 })
  })

  it('rejects while the failure switch is on', async () => {
    const api = createMockReviewApi({ failures: ['getFindings'] })
    await expect(api.getFindings(RUN_ID)).rejects.toBeInstanceOf(ApiError)
    api.setFailure('getFindings', false)
    await expect(api.getFindings(RUN_ID)).resolves.toHaveLength(mockAppState.server.findings.length)
  })

  it('aborts a pending request', async () => {
    const api = createMockReviewApi({ delayMs: 1000 })
    const controller = new AbortController()
    const pending = api.getRun(RUN_ID, controller.signal)
    controller.abort()
    await expect(pending).rejects.toMatchObject({ name: 'AbortError' })
  })

  it('does not share mutable state with the fixtures or callers', async () => {
    const api = createMockReviewApi()
    const findings = (await api.getFindings(RUN_ID)) as { title: string }[]
    findings[0].title = 'changed'
    const again = (await api.getFindings(RUN_ID)) as { title: string }[]
    expect(again[0].title).toBe(mockAppState.server.findings[0].title)
  })
})

describe('mock mutations', () => {
  const now = () => new Date('2026-10-07T10:00:00Z')

  it('appends a reply and returns it', async () => {
    const api = createMockReviewApi({ author: 'tester', now })
    const reply = await api.replyToFinding({
      runId: RUN_ID,
      findingId: 'f-sql-injection',
      body: 'Fixed in abc123',
    })
    expect(reply).toEqual({
      reply_id: 'mock-reply-1',
      author: 'tester',
      body: 'Fixed in abc123',
      created_at: '2026-10-07T10:00:00.000Z',
    })
    const findings = (await api.getFindings(RUN_ID)) as { finding_id: string; replies: unknown[] }[]
    expect(findings.find((item) => item.finding_id === 'f-sql-injection')?.replies).toEqual([reply])
  })

  it('updates the finding status and keeps its content', async () => {
    const api = createMockReviewApi()
    const updated = await api.setFindingStatus({
      runId: RUN_ID,
      findingId: 'f-sql-injection',
      status: 'resolved',
    })
    expect(updated).toEqual({ ...mockAppState.server.findings[0], status: 'resolved' })
  })

  it('rejects an unknown finding', async () => {
    const api = createMockReviewApi()
    await expect(
      api.setFindingStatus({ runId: RUN_ID, findingId: 'missing', status: 'resolved' }),
    ).rejects.toMatchObject({ status: 404 })
  })

  it('fails mutations while the failure switch is on and changes nothing', async () => {
    const api = createMockReviewApi({ failures: ['replyToFinding', 'setFindingStatus'] })
    await expect(
      api.replyToFinding({ runId: RUN_ID, findingId: 'f-sql-injection', body: 'x' }),
    ).rejects.toBeInstanceOf(ApiError)
    await expect(
      api.setFindingStatus({ runId: RUN_ID, findingId: 'f-sql-injection', status: 'resolved' }),
    ).rejects.toBeInstanceOf(ApiError)
    expect(await api.getFindings(RUN_ID)).toEqual(mockAppState.server.findings)
  })
})

describe('mock repositories', () => {
  const now = () => new Date('2026-10-07T10:00:00Z')

  it('lists the connected and available fixtures', async () => {
    const api = createMockReviewApi()
    await expect(api.listRepositories()).resolves.toEqual(mockRepositoryState.connected)
    await expect(api.listAvailableRepositories()).resolves.toEqual(mockRepositoryState.available)
  })

  it('connects a repository and lists it as connected', async () => {
    const api = createMockReviewApi({ now })
    const created = await api.connectRepository({ provider: 'github', externalId: '810000003' })
    expect(created).toEqual({
      repository_id: 'mock-repo-1',
      provider: 'github',
      external_id: '810000003',
      full_name: 'acme/docs',
      url: 'https://github.com/acme/docs',
      default_branch: 'main',
      private: false,
      connected_at: '2026-10-07T10:00:00.000Z',
    })
    const connected = (await api.listRepositories()) as { full_name: string }[]
    expect(connected.map((item) => item.full_name)).toContain('acme/docs')
    const available = (await api.listAvailableRepositories()) as {
      external_id: string
      repository_id: string | null
    }[]
    expect(available.find((item) => item.external_id === '810000003')?.repository_id).toBe(
      'mock-repo-1',
    )
  })

  it('rejects a repository that is already connected with a 409', async () => {
    const api = createMockReviewApi()
    await expect(
      api.connectRepository({ provider: 'github', externalId: '810000001' }),
    ).rejects.toMatchObject({ status: 409 })
  })

  it('rejects an unknown repository with a 404', async () => {
    const api = createMockReviewApi()
    await expect(
      api.connectRepository({ provider: 'gitlab', externalId: '810000003' }),
    ).rejects.toMatchObject({ status: 404 })
  })

  it('uses the injected repositories without changing the fixtures', async () => {
    const api = createMockReviewApi({ repositories: { connected: [], available: [] } })
    await expect(api.listRepositories()).resolves.toEqual([])
    await createMockReviewApi().connectRepository({ provider: 'github', externalId: '810000004' })
    expect(mockRepositoryState.connected).toHaveLength(3)
    expect(mockRepositoryState.available[3].repository_id).toBeNull()
  })

  it('fails while the failure switch is on and connects nothing', async () => {
    const api = createMockReviewApi({
      failures: ['listRepositories', 'listAvailableRepositories', 'connectRepository'],
    })
    await expect(api.listRepositories()).rejects.toBeInstanceOf(ApiError)
    await expect(api.listAvailableRepositories()).rejects.toBeInstanceOf(ApiError)
    await expect(
      api.connectRepository({ provider: 'github', externalId: '810000003' }),
    ).rejects.toMatchObject({ status: 500 })
    api.setFailure('listRepositories', false)
    await expect(api.listRepositories()).resolves.toEqual(mockRepositoryState.connected)
  })
})

describe('failuresFromSearch', () => {
  it('keeps only known method names', () => {
    expect(failuresFromSearch('?mockFail=replyToFinding,unknown')).toEqual(['replyToFinding'])
    expect(failuresFromSearch('?mockFail=listRuns')).toEqual(['listRuns'])
    expect(failuresFromSearch('?mockFail=connectRepository,listRepositories')).toEqual([
      'listRepositories',
      'connectRepository',
    ])
    expect(failuresFromSearch('')).toEqual([])
  })
})

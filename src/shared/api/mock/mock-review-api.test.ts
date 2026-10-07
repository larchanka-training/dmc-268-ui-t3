import { describe, expect, it } from 'vitest'
import { ApiError } from '../review-api'
import { mockAppState, RUN_ID } from './app-state.mock'
import { createMockReviewApi, failuresFromSearch } from './mock-review-api'

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

describe('failuresFromSearch', () => {
  it('keeps only known method names', () => {
    expect(failuresFromSearch('?mockFail=replyToFinding,unknown')).toEqual(['replyToFinding'])
    expect(failuresFromSearch('?mockFail=listRuns')).toEqual(['listRuns'])
    expect(failuresFromSearch('')).toEqual([])
  })
})

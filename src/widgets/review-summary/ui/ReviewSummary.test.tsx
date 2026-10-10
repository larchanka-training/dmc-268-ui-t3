import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { diffViewStore, parseUnifiedDiff, type DiffFile } from '@/entities/diff'
import { findingListSchema, findingNavStore } from '@/entities/finding'
import { reviewRunSchema } from '@/entities/review-run'
import type { FindingWire } from '@/shared/api'
import { mockAppState } from '@/shared/api/mock/app-state.mock'
import { renderWithProviders } from '@/shared/lib/test/render'
import { ReviewSummary } from './ReviewSummary'

const parsed = parseUnifiedDiff(mockAppState.server.diffText)
const files: DiffFile[] = parsed.ok ? parsed.files : []
const findings = findingListSchema.parse(mockAppState.server.findings)
const run = reviewRunSchema.parse(mockAppState.server.run)

beforeEach(() => {
  diffViewStore.getState().actions.reset()
  findingNavStore.getState().actions.reset()
})

describe('ReviewSummary', () => {
  it('counts findings by severity group and by resolution', () => {
    renderWithProviders(<ReviewSummary run={run} files={files} findings={findings} />)
    const counts = within(screen.getByRole('list', { name: 'Findings by severity' }))
      .getAllByRole('listitem')
      .map((item) => item.textContent)
    expect(counts).toEqual(['Critical1', 'Warning5', 'Info1'])
    expect(screen.getByText('6 unresolved')).toBeVisible()
    expect(screen.getByText('1 resolved')).toBeVisible()
  })

  it('groups high and medium findings as Warning', () => {
    const levels = (['critical', 'high', 'high', 'medium', 'low'] as const).map((severity, i) => ({
      ...findings[0],
      id: `f-${String(i)}`,
      severity,
    }))
    renderWithProviders(<ReviewSummary run={run} files={files} findings={levels} />)
    const counts = within(screen.getByRole('list', { name: 'Findings by severity' }))
      .getAllByRole('listitem')
      .map((item) => item.textContent)
    expect(counts).toEqual(['Critical1', 'Warning3', 'Info1'])
  })

  it('explains partial coverage and lists its limitations', () => {
    renderWithProviders(<ReviewSummary run={run} files={files} findings={findings} />)
    expect(screen.getByRole('note')).toHaveTextContent('Part of this change was not reviewed')
    expect(
      within(screen.getByRole('list', { name: 'Coverage limitations' })).getAllByRole('listitem'),
    ).toHaveLength(2)
  })

  it('shows no coverage warning for a complete review', () => {
    const complete = { ...run, coverage: { status: 'complete' as const, limitations: [] } }
    renderWithProviders(<ReviewSummary run={complete} files={files} findings={findings} />)
    expect(screen.queryByRole('note')).toBeNull()
  })

  it('moves to the next finding in file and line order', async () => {
    const five: FindingWire[] = [3, 1, 5, 2, 4].map((line) => ({
      ...mockAppState.server.findings[0],
      finding_id: `f-${String(line)}`,
      anchor: { path: 'src/services/user-service.ts', side: 'RIGHT', line },
    }))
    renderWithProviders(
      <ReviewSummary run={run} files={files} findings={findingListSchema.parse(five)} />,
    )
    findingNavStore.getState().actions.selectFinding('f-2')
    expect(await screen.findByText('Finding 2 of 5')).toBeVisible()
    await userEvent.click(screen.getByRole('button', { name: 'Next finding' }))
    expect(findingNavStore.getState().selectedFindingId).toBe('f-3')
    expect(screen.getByText('Finding 3 of 5')).toBeVisible()
    await userEvent.click(screen.getByRole('button', { name: 'Previous finding' }))
    expect(findingNavStore.getState().selectedFindingId).toBe('f-2')
  })

  it('expands a collapsed file when navigating into it', async () => {
    diffViewStore.getState().actions.setFileCollapsed('src/services/user-service.ts', true)
    renderWithProviders(<ReviewSummary run={run} files={files} findings={findings} />)
    // Diff order: settings.py (2 findings), search-endpoint.ts (1), then user-service.ts.
    for (let step = 0; step < 4; step++) {
      await userEvent.click(screen.getByRole('button', { name: 'Next finding' }))
    }
    expect(findingNavStore.getState().selectedFindingId).toBe('f-null-check')
    expect(diffViewStore.getState().fileCollapse['src/services/user-service.ts']).toBe(false)
  })
})

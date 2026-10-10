import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { diffViewStore } from '@/entities/diff'
import { findingElementId, findingNavStore } from '@/entities/finding'
import type { ReviewApi } from '@/shared/api'
import { mockAppState, RUN_ID } from '@/shared/api/mock/app-state.mock'
import { createMockReviewApi, type MockReviewApiOptions } from '@/shared/api/mock/mock-review-api'
import { renderWithProviders } from '@/shared/lib/test/render'
import { ReviewRunPage } from './ReviewRunPage'

type ServerState = NonNullable<MockReviewApiOptions['state']>

function withState(overrides: Partial<ServerState>, options: MockReviewApiOptions = {}) {
  return createMockReviewApi({ ...options, state: { ...mockAppState.server, ...overrides } })
}

const run = mockAppState.server.run

function renderPage(api: ReviewApi = createMockReviewApi()) {
  return renderWithProviders(<ReviewRunPage runId={RUN_ID} />, { api })
}

beforeEach(() => {
  diffViewStore.getState().actions.reset()
  findingNavStore.getState().actions.reset()
})

describe('ReviewRunPage', () => {
  it('shows a loading state', () => {
    renderPage(createMockReviewApi({ delayMs: 10_000 }))
    expect(screen.getByRole('status')).toHaveTextContent('Loading review…')
  })

  it('shows an error with a working retry', async () => {
    const api = createMockReviewApi({ failures: ['getRun'] })
    renderPage(api)
    expect(await screen.findByRole('alert')).toHaveTextContent('server returned an error (500)')
    api.setFailure('getRun', false)
    await userEvent.click(screen.getByRole('button', { name: 'Retry' }))
    expect(await screen.findByRole('region', { name: 'Review summary' })).toBeVisible()
  })

  it('treats an invalid payload as an error instead of rendering it', async () => {
    renderPage(
      withState({
        run: { ...run, coverage: { status: 'mostly', limitations: [] } } as unknown as typeof run,
      }),
    )
    expect(await screen.findByRole('alert')).toHaveTextContent('unexpected format')
    expect(screen.queryByRole('region', { name: 'Review summary' })).toBeNull()
  })

  it('treats a malformed diff as an error', async () => {
    renderPage(withState({ diffText: '--- a/x\n+++ b/x\n@@ broken @@\n' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('diff could not be parsed')
  })

  it('says "no issues" only for a complete review without findings', async () => {
    renderPage(
      withState({
        findings: [],
        run: { ...run, coverage: { status: 'complete', limitations: [] } },
      }),
    )
    expect(await screen.findByText(/No issues found/)).toBeVisible()
  })

  it('never says "no issues" when coverage is partial', async () => {
    renderPage(withState({ findings: [] }))
    expect(await screen.findByRole('note')).toHaveTextContent(
      'Part of this change was not reviewed',
    )
    expect(screen.getByRole('list', { name: 'Coverage limitations' })).toBeVisible()
    expect(screen.queryByText(/No issues found/)).toBeNull()
  })

  it('never says "no issues" when coverage failed', async () => {
    renderPage(
      withState({
        findings: [],
        run: {
          ...run,
          status: 'FAILED',
          coverage: { status: 'failed', limitations: ['Model request timed out.'] },
        },
      }),
    )
    expect(await screen.findByRole('note')).toHaveTextContent('could not analyze this change')
    expect(screen.getByText('Model request timed out.')).toBeVisible()
    expect(screen.queryByText(/No issues found/)).toBeNull()
  })

  it('scrolls to the next finding in the composed page', async () => {
    const scrollIntoView = vi.spyOn(Element.prototype, 'scrollIntoView')
    renderPage()
    await screen.findByRole('region', { name: 'Review summary' })
    findingNavStore.getState().actions.selectFinding('f-wildcard-hosts')
    await userEvent.click(await screen.findByRole('button', { name: 'Next finding' }))
    expect(screen.getByText('Finding 3 of 7')).toBeVisible()
    const card = document.getElementById(findingElementId('f-reflected-xss'))
    expect(card).toHaveAttribute('data-selected', 'true')
    await waitFor(() => {
      expect(scrollIntoView.mock.contexts).toContain(card)
    })
  })

  it('keeps an unsent reply draft when a finding is resolved and reopened', async () => {
    renderPage()
    const card = await screen.findByRole('article', {
      name: 'Finding: DEBUG is enabled in shared settings',
    })
    await userEvent.type(within(card).getByRole('textbox', { name: 'Reply' }), 'half-written note')
    await userEvent.click(within(card).getByRole('button', { name: 'Resolve' }))
    await userEvent.click(await within(card).findByRole('button', { name: 'Unresolve' }))
    await waitFor(() => {
      expect(card).toHaveAttribute('data-status', 'open')
    })
    expect(within(card).getByRole('textbox', { name: 'Reply' })).toHaveValue('half-written note')
  })

  it('opens with the pull request header and its verdict', async () => {
    renderPage()
    expect(await screen.findByRole('heading', { level: 1 })).toHaveTextContent(run.title)
    const overview = screen.getByRole('region', { name: 'Pull request' })
    expect(within(overview).getByText('Changes requested')).toBeVisible()
    expect(within(overview).getByText('Run: Completed')).toBeVisible()
  })

  it('treats an unsafe pull request URL as an error with a retry', async () => {
    renderPage(withState({ run: { ...run, pull_request_url: 'javascript:alert(1)' } }))
    expect(await screen.findByRole('alert')).toHaveTextContent('unexpected format')
    expect(screen.getByRole('button', { name: 'Retry' })).toBeVisible()
    expect(screen.queryByRole('link', { name: /View pull request/ })).toBeNull()
  })

  it('keeps the verdict when the only critical finding is resolved', async () => {
    renderPage()
    const card = await screen.findByRole('article', {
      name: 'Finding: User input is interpolated into a SQL query',
    })
    await userEvent.click(within(card).getByRole('button', { name: 'Resolve' }))
    await waitFor(() => {
      expect(card).toHaveAttribute('data-status', 'resolved')
    })
    const overview = screen.getByRole('region', { name: 'Pull request' })
    expect(within(overview).getByText('Changes requested')).toBeVisible()
  })
})

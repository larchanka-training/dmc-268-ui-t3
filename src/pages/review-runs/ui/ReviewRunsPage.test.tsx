import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import type { ReviewApi } from '@/shared/api'
import { mockAppState } from '@/shared/api/mock/app-state.mock'
import { createMockReviewApi } from '@/shared/api/mock/mock-review-api'
import { renderWithRouter } from '@/shared/lib/test/render-with-router'
import { ReviewRunsPage } from './ReviewRunsPage'

const base = mockAppState.server.run

function apiWith(listRuns: ReviewApi['listRuns']): ReviewApi {
  return { ...createMockReviewApi(), listRuns }
}

describe('ReviewRunsPage', () => {
  it('shows a loading state', async () => {
    await renderWithRouter(<ReviewRunsPage />, {
      api: apiWith(() => new Promise(() => undefined)),
    })
    expect(screen.getByRole('status')).toHaveTextContent('Loading review runs…')
  })

  it('lists runs newest first, each linking to its page', async () => {
    const runs = [
      { ...base, run_id: 'run-old', title: 'Old run', created_at: '2026-10-01T09:00:00Z' },
      { ...base, run_id: 'run-new', title: 'New run', created_at: '2026-10-06T09:00:00Z' },
    ]
    await renderWithRouter(<ReviewRunsPage />, {
      api: apiWith(() => Promise.resolve(runs)),
      path: '/runs',
    })
    const list = await screen.findByRole('list', { name: 'Review runs' })
    const links = within(list).getAllByRole('link')
    expect(links.map((link) => link.getAttribute('href'))).toEqual([
      '/runs/run-new',
      '/runs/run-old',
    ])
    expect(links[0]).toHaveTextContent('New run')
    expect(links[0]).toHaveTextContent(`${base.repository}#${String(base.pull_request)}`)
    expect(links[0]).toHaveTextContent('Run: Completed')
    expect(links[0]).toHaveTextContent('Coverage: Partial')
  })

  it('says when there are no runs', async () => {
    await renderWithRouter(<ReviewRunsPage />, { api: apiWith(() => Promise.resolve([])) })
    expect(await screen.findByText(/No review runs yet/)).toBeInTheDocument()
  })

  it('shows an error without a partial list, and retries', async () => {
    const api = createMockReviewApi({ failures: ['listRuns'] })
    await renderWithRouter(<ReviewRunsPage />, { api })
    expect(await screen.findByRole('alert')).toHaveTextContent('server returned an error (500)')
    expect(screen.queryByRole('list', { name: 'Review runs' })).not.toBeInTheDocument()

    api.setFailure('listRuns', false)
    await userEvent.click(screen.getByRole('button', { name: 'Retry' }))
    expect(await screen.findByRole('list', { name: 'Review runs' })).toBeInTheDocument()
  })

  it('treats an invalid payload as an error', async () => {
    await renderWithRouter(<ReviewRunsPage />, {
      api: apiWith(() => Promise.resolve([{ ...base, status: 'DONE' }])),
    })
    expect(await screen.findByRole('alert')).toHaveTextContent('unexpected format')
  })
})

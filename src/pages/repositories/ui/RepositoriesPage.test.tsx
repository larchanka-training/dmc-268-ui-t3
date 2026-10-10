import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import type { RepositoryWire, ReviewApi } from '@/shared/api'
import { createMockReviewApi } from '@/shared/api/mock/mock-review-api'
import { mockRepositoryState } from '@/shared/api/mock/repositories.mock'
import { renderWithRouter } from '@/shared/lib/test/render-with-router'
import { RepositoriesPage } from './RepositoriesPage'

const [web, billing, infra] = mockRepositoryState.connected

function apiWith(listRepositories: ReviewApi['listRepositories']): ReviewApi {
  return { ...createMockReviewApi(), listRepositories }
}

function entries() {
  return within(screen.getByRole('list', { name: 'Connected repositories' })).getAllByRole(
    'listitem',
  )
}

describe('RepositoriesPage', () => {
  it('shows a loading state', async () => {
    await renderWithRouter(<RepositoriesPage />, {
      api: apiWith(() => new Promise(() => undefined)),
    })
    expect(screen.getByRole('status')).toHaveTextContent('Loading repositories…')
    expect(screen.queryByRole('list')).not.toBeInTheDocument()
  })

  it('lists repositories sorted by full name with their details', async () => {
    const api = apiWith(() =>
      Promise.resolve([web, { ...billing, full_name: 'acme/api' } satisfies RepositoryWire, infra]),
    )
    await renderWithRouter(<RepositoriesPage />, { api, path: '/repositories' })
    await screen.findByRole('list', { name: 'Connected repositories' })
    const items = entries()
    // '-' sorts before '/', so the acme-group namespace comes first.
    expect(items.map((item) => item.querySelector('.font-medium')?.textContent)).toEqual([
      'acme-group/platform/infra',
      'acme/api',
      'acme/web',
    ])
    expect(items[0]).toHaveTextContent('GitLab')
    expect(items[1]).toHaveTextContent('GitHub')
    expect(items[1]).toHaveTextContent('Private')
    expect(items[1]).toHaveTextContent('Default branch:develop')
    expect(items[1]).toHaveTextContent('Connected Oct 3, 2026, 2:05 PM UTC')
    expect(items[2]).toHaveTextContent('Public')
  })

  it('links each repository to its provider page in a new tab without opener access', async () => {
    await renderWithRouter(<RepositoriesPage />, { api: apiWith(() => Promise.resolve([infra])) })
    const link = await screen.findByRole('link', {
      name: 'Open acme-group/platform/infra on GitLab',
    })
    expect(link).toHaveAttribute('href', 'https://gitlab.com/acme-group/platform/infra')
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')
  })

  it('offers "Connect repository" next to a non-empty list', async () => {
    await renderWithRouter(<RepositoriesPage />, { api: apiWith(() => Promise.resolve([web])) })
    await screen.findByRole('list', { name: 'Connected repositories' })
    expect(screen.getByRole('link', { name: 'Connect repository' })).toHaveAttribute(
      'href',
      '/repositories/connect',
    )
  })

  it('says when nothing is connected and links to the connect screen', async () => {
    await renderWithRouter(<RepositoriesPage />, { api: apiWith(() => Promise.resolve([])) })
    expect(await screen.findByText(/No repositories connected yet/)).toBeInTheDocument()
    const links = screen.getAllByRole('link', { name: 'Connect repository' })
    expect(links).toHaveLength(1)
    expect(links[0]).toHaveAttribute('href', '/repositories/connect')
  })

  it('shows an error without a partial list, and retries', async () => {
    const api = createMockReviewApi({ failures: ['listRepositories'] })
    await renderWithRouter(<RepositoriesPage />, { api })
    expect(await screen.findByRole('alert')).toHaveTextContent('server returned an error (500)')
    expect(screen.queryByRole('list')).not.toBeInTheDocument()

    api.setFailure('listRepositories', false)
    await userEvent.click(screen.getByRole('button', { name: 'Retry' }))
    expect(await screen.findByRole('list', { name: 'Connected repositories' })).toBeInTheDocument()
  })

  it('treats an unsafe URL as an invalid payload and renders no link to it', async () => {
    await renderWithRouter(<RepositoriesPage />, {
      api: apiWith(() => Promise.resolve([{ ...web, url: 'javascript:alert(1)' }])),
    })
    expect(await screen.findByRole('alert')).toHaveTextContent('unexpected format')
    expect(document.querySelector('a[href^="javascript"]')).toBeNull()
  })
})

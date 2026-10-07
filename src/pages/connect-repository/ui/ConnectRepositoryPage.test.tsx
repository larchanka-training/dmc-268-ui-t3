import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { ReviewApi } from '@/shared/api'
import { createMockReviewApi } from '@/shared/api/mock/mock-review-api'
import { renderWithRouter } from '@/shared/lib/test/render-with-router'
import { ConnectRepositoryPage } from './ConnectRepositoryPage'

const INSTALL_URL = 'https://github.com/apps/dmc-268-review-t3/installations/new'

function apiWith(listAvailableRepositories: ReviewApi['listAvailableRepositories']): ReviewApi {
  return { ...createMockReviewApi(), listAvailableRepositories }
}

async function renderPage(
  api: ReviewApi = createMockReviewApi(),
  installUrl: string | null = null,
) {
  const onConnected = vi.fn()
  const result = await renderWithRouter(
    <ConnectRepositoryPage githubAppInstallUrl={installUrl} onConnected={onConnected} />,
    { api, path: '/repositories/connect' },
  )
  return { ...result, onConnected }
}

function rowNames() {
  return within(screen.getByRole('list', { name: 'Accessible repositories' }))
    .getAllByRole('listitem')
    .map((item) => item.querySelector('.font-medium')?.textContent)
}

function row(fullName: string) {
  const item = within(screen.getByRole('list', { name: 'Accessible repositories' }))
    .getAllByRole('listitem')
    .find((element) => element.querySelector('.font-medium')?.textContent === fullName)
  if (!item) throw new Error(`No row for ${fullName}`)
  return item
}

describe('ConnectRepositoryPage', () => {
  it('shows a loading state', async () => {
    await renderPage(apiWith(() => new Promise(() => undefined)))
    expect(screen.getByRole('status')).toHaveTextContent('Loading repositories…')
  })

  it('lists accessible repositories sorted, with Connect or Connected per row', async () => {
    await renderPage()
    await screen.findByRole('list', { name: 'Accessible repositories' })
    expect(rowNames()).toEqual([
      'acme/billing-api',
      'acme/design-system',
      'acme/docs',
      'acme/mobile-app',
      'acme/web',
      'octocat/dotfiles',
    ])
    expect(within(row('acme/web')).getByText('Connected')).toBeInTheDocument()
    expect(within(row('acme/web')).queryByRole('button')).toBeNull()
    expect(
      within(row('acme/docs')).getByRole('button', { name: 'Connect acme/docs' }),
    ).toBeEnabled()
    expect(within(row('acme/mobile-app')).getByText('Private')).toBeInTheDocument()
  })

  it('links back to Repositories', async () => {
    await renderPage()
    expect(screen.getByRole('link', { name: 'Repositories' })).toHaveAttribute(
      'href',
      '/repositories',
    )
  })

  it('filters case-insensitively and says when nothing matches', async () => {
    await renderPage()
    const filter = await screen.findByRole('searchbox', { name: 'Filter repositories' })
    await userEvent.type(filter, 'DOC')
    expect(rowNames()).toEqual(['acme/docs'])

    await userEvent.clear(filter)
    await userEvent.type(filter, 'nothing-here')
    expect(screen.getByRole('status')).toHaveTextContent('No repositories match “nothing-here”.')
    expect(screen.queryByRole('list', { name: 'Accessible repositories' })).toBeNull()

    await userEvent.clear(filter)
    expect(rowNames()).toHaveLength(6)
  })

  it('calls onConnected after a repository is connected', async () => {
    const { onConnected } = await renderPage()
    await screen.findByRole('list', { name: 'Accessible repositories' })
    await userEvent.click(screen.getByRole('button', { name: 'Connect acme/docs' }))
    await waitFor(() => {
      expect(onConnected).toHaveBeenCalledOnce()
    })
  })

  it('keeps other rows usable when one connection fails', async () => {
    const api = createMockReviewApi({ failures: ['connectRepository'] })
    const { onConnected } = await renderPage(api)
    await screen.findByRole('list', { name: 'Accessible repositories' })
    await userEvent.click(screen.getByRole('button', { name: 'Connect acme/docs' }))
    expect(await within(row('acme/docs')).findByRole('alert')).toHaveTextContent(
      'could not be connected',
    )
    expect(within(row('acme/mobile-app')).queryByRole('alert')).toBeNull()
    expect(within(row('acme/mobile-app')).getByRole('button')).toBeEnabled()
    expect(onConnected).not.toHaveBeenCalled()
  })

  it('says when no accessible repositories are found', async () => {
    await renderPage(apiWith(() => Promise.resolve([])))
    expect(
      await screen.findByText('No repositories found that the reviewer can access.'),
    ).toBeInTheDocument()
  })

  it('shows an error without a list, and retries', async () => {
    const api = createMockReviewApi({ failures: ['listAvailableRepositories'] })
    await renderPage(api)
    expect(await screen.findByRole('alert')).toHaveTextContent('server returned an error (500)')
    expect(screen.queryByRole('list')).toBeNull()

    api.setFailure('listAvailableRepositories', false)
    await userEvent.click(screen.getByRole('button', { name: 'Retry' }))
    expect(await screen.findByRole('list', { name: 'Accessible repositories' })).toBeInTheDocument()
  })

  it('treats an invalid payload as an error', async () => {
    await renderPage(apiWith(() => Promise.resolve([{ provider: 'bitbucket', external_id: '1' }])))
    expect(await screen.findByRole('alert')).toHaveTextContent('unexpected format')
  })

  it('links to the GitHub App installation page when configured', async () => {
    await renderPage(createMockReviewApi(), INSTALL_URL)
    const link = screen.getByRole('link', { name: 'Install the GitHub App on more repositories' })
    expect(link).toHaveAttribute('href', INSTALL_URL)
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')
  })

  it('shows no installation link without a configured app, and still lists repositories', async () => {
    await renderPage()
    expect(await screen.findByRole('list', { name: 'Accessible repositories' })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /Install the GitHub App/ })).toBeNull()
  })
})

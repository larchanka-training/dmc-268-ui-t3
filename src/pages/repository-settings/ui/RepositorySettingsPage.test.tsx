import { act, screen, within } from '@testing-library/react'
import { useState } from 'react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { ReviewApi } from '@/shared/api'
import { mockAppState } from '@/shared/api/mock/app-state.mock'
import { createMockReviewApi } from '@/shared/api/mock/mock-review-api'
import { mockRepositoryState } from '@/shared/api/mock/repositories.mock'
import { renderWithRouter } from '@/shared/lib/test/render-with-router'
import { RepositorySettingsPage } from './RepositorySettingsPage'

function renderPage(repositoryId: string, api: ReviewApi = createMockReviewApi()) {
  return renderWithRouter(<RepositorySettingsPage repositoryId={repositoryId} />, {
    api,
    path: `/repositories/${repositoryId}/settings`,
  })
}

/** Renders the page and waits until the repository has loaded and the sections exist. */
async function renderLoaded(repositoryId: string, api: ReviewApi = createMockReviewApi()) {
  const view = await renderPage(repositoryId, api)
  await screen.findByRole('region', { name: 'Review settings' })
  return view
}

function section(name: string) {
  return screen.getByRole('region', { name })
}

/** Switches the page to another repository, as navigating between settings pages does. */
function Switcher() {
  const [repositoryId, setRepositoryId] = useState('repo-1')
  return (
    <>
      <button
        type="button"
        onClick={() => {
          setRepositoryId('repo-3')
        }}
      >
        Next repository
      </button>
      <RepositorySettingsPage repositoryId={repositoryId} />
    </>
  )
}

const never = () => new Promise<never>(() => undefined)

describe('RepositorySettingsPage', () => {
  it('shows a loading state without sections', async () => {
    await renderPage('repo-1', { ...createMockReviewApi(), getRepository: never })
    expect(screen.getByRole('status')).toHaveTextContent('Loading repository…')
    expect(screen.queryByRole('region')).toBeNull()
  })

  it('shows the repository header, a back link and the three sections', async () => {
    await renderPage('repo-1')
    expect(await screen.findByRole('heading', { level: 1, name: 'acme/web' })).toBeInTheDocument()
    const main = screen.getByRole('heading', { level: 1 }).parentElement?.parentElement
    expect(main).toHaveTextContent('GitHub')
    expect(main).toHaveTextContent('Public')
    expect(main).toHaveTextContent('Default branch:main')
    const external = screen.getByRole('link', { name: 'Open acme/web on GitHub' })
    expect(external).toHaveAttribute('href', 'https://github.com/acme/web')
    expect(external).toHaveAttribute('target', '_blank')
    expect(external).toHaveAttribute('rel', 'noopener noreferrer')
    expect(screen.getByRole('link', { name: 'Repositories' })).toHaveAttribute(
      'href',
      '/repositories',
    )
    for (const name of ['Review settings', 'Rules', 'Review history']) {
      expect(section(name)).toBeInTheDocument()
      expect(within(section(name)).getByRole('heading', { level: 2, name })).toBeInTheDocument()
    }
  })

  it('says an unknown repository was not found, without a retry', async () => {
    await renderPage('unknown')
    expect(await screen.findByRole('heading', { name: 'Repository not found' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Go to Repositories' })).toHaveAttribute(
      'href',
      '/repositories',
    )
    expect(screen.queryByRole('button', { name: 'Retry' })).toBeNull()
    expect(screen.queryByRole('region')).toBeNull()
  })

  it('shows an error with Retry for other failures', async () => {
    const api = createMockReviewApi({ failures: ['getRepository'] })
    const getRepository = vi.spyOn(api, 'getRepository')
    await renderPage('repo-1', api)
    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent('The repository could not be loaded.')
    expect(alert).toHaveTextContent('The server returned an error (500).')
    expect(screen.queryByRole('region')).toBeNull()

    api.setFailure('getRepository', false)
    await userEvent.click(within(alert).getByRole('button', { name: 'Retry' }))
    expect(await screen.findByRole('heading', { level: 1, name: 'acme/web' })).toBeInTheDocument()
    expect(getRepository).toHaveBeenCalledTimes(2)
  })
})

describe('Review settings section', () => {
  it('shows the current settings', async () => {
    await renderLoaded('repo-1')
    const settings = section('Review settings')
    expect(await within(settings).findByRole('switch', { name: 'Automatic review' })).toBeChecked()
    expect(within(settings).getByRole('textbox', { name: 'Branch filter' })).toHaveValue(
      'main\nrelease/*',
    )
  })

  it('fails on its own with Retry while the other sections load', async () => {
    const api = createMockReviewApi({ failures: ['getReviewSettings'] })
    await renderLoaded('repo-1', api)
    const alert = await within(section('Review settings')).findByRole('alert')
    expect(alert).toHaveTextContent('The review settings could not be loaded.')
    expect(within(section('Review settings')).queryByRole('switch')).toBeNull()
    expect(await within(section('Rules')).findByText('Custom rules')).toBeInTheDocument()
    expect(
      await within(section('Review history')).findByText(/No reviews have run/),
    ).toBeInTheDocument()

    api.setFailure('getReviewSettings', false)
    await userEvent.click(within(alert).getByRole('button', { name: 'Retry' }))
    expect(
      await within(section('Review settings')).findByRole('switch', { name: 'Automatic review' }),
    ).toBeInTheDocument()
  })

  it('shows an invalid settings payload as an error', async () => {
    const api: ReviewApi = {
      ...createMockReviewApi(),
      getReviewSettings: () =>
        Promise.resolve({
          ...mockRepositoryState.settings['repo-1'],
          severity_threshold: 'medium_and_up',
        }),
    }
    await renderLoaded('repo-1', api)
    expect(await within(section('Review settings')).findByRole('alert')).toHaveTextContent(
      'unexpected format',
    )
  })

  it('does not carry a draft over to another repository', async () => {
    await renderWithRouter(<Switcher />, { api: createMockReviewApi() })
    const branches = await screen.findByRole('textbox', { name: 'Branch filter' })
    await userEvent.type(branches, '\nhotfix/*')
    await userEvent.click(screen.getByRole('button', { name: 'Next repository' }))
    await screen.findByRole('heading', { level: 1, name: 'acme-group/platform/infra' })
    expect(await screen.findByRole('textbox', { name: 'Branch filter' })).toHaveValue('')
  })
})

describe('Rules section', () => {
  it('shows custom rules with their source and preview', async () => {
    await renderLoaded('repo-1')
    const rules = section('Rules')
    expect(await within(rules).findByText('Custom rules')).toBeInTheDocument()
    expect(rules).toHaveTextContent('Branchmain')
    expect(
      within(rules).getByTitle(mockRepositoryState.rules['repo-1'].commit_sha ?? ''),
    ).toHaveTextContent('3f2a9c1')
    expect(rules).toHaveTextContent('Rules versionrules-2026-10-02')
    const file = within(rules).getByRole('link', { name: 'Open .review/rules.md on GitHub' })
    expect(file).toHaveAttribute('href', 'https://github.com/acme/web/blob/main/.review/rules.md')
    expect(file).toHaveAttribute('rel', 'noopener noreferrer')
    expect(file).toHaveAttribute('target', '_blank')
    expect(within(rules).queryByRole('note')).toBeNull()
    const items = within(within(rules).getByRole('list', { name: 'Rules in effect' })).getAllByRole(
      'listitem',
    )
    expect(items.map((item) => item.querySelector('code')?.textContent)).toEqual([
      'SEC-001',
      'A11Y-002',
      'STY-004',
    ])
  })

  it('warns that the default rules are used when the file is missing', async () => {
    await renderLoaded('repo-2')
    const rules = section('Rules')
    expect(await within(rules).findByText('Default rules')).toBeInTheDocument()
    const note = within(rules).getByRole('note')
    expect(note).toHaveTextContent('Default rules are being used; create .review/rules.md')
    expect(note).toHaveTextContent('No .review/rules.md was found on develop.')
    expect(within(rules).queryByRole('link')).toBeNull()
    expect(rules).not.toHaveTextContent('Commit')
    expect(
      within(within(rules).getByRole('list', { name: 'Rules in effect' })).getAllByRole('listitem'),
    ).toHaveLength(5)
  })

  it('lists the problems of an invalid file as text', async () => {
    const invalid = mockRepositoryState.rules['repo-3']
    const api: ReviewApi = {
      ...createMockReviewApi(),
      getRepositoryRules: () =>
        Promise.resolve({
          ...invalid,
          problems: [...invalid.problems, { message: '<img src=x onerror=alert(1)>', line: 3 }],
        }),
    }
    const { container } = await renderLoaded('repo-3', api)
    const rules = section('Rules')
    expect(await within(rules).findByText('Rules file invalid')).toBeInTheDocument()
    const note = within(rules).getByRole('note')
    expect(note).toHaveTextContent(
      '.review/rules.md on main could not be read, so the default rules are being used.',
    )
    const problems = within(note)
      .getAllByRole('listitem')
      .map((item) => item.textContent)
    expect(problems).toEqual([
      'Line 12: Unknown severity `urgent`',
      'Missing rule ID',
      'Line 3: <img src=x onerror=alert(1)>',
    ])
    expect(container.querySelector('img')).toBeNull()
  })

  it('says when no rules are enabled', async () => {
    const api: ReviewApi = {
      ...createMockReviewApi(),
      getRepositoryRules: () =>
        Promise.resolve({ ...mockRepositoryState.rules['repo-1'], rules: [] }),
    }
    await renderLoaded('repo-1', api)
    expect(
      await within(section('Rules')).findByText(
        'No rules are enabled, so the reviewer reports no findings.',
      ),
    ).toBeInTheDocument()
  })

  it('fails on its own with Retry and renders no unsafe link', async () => {
    const api = createMockReviewApi()
    let calls = 0
    api.getRepositoryRules = () => {
      calls += 1
      return Promise.resolve({
        ...mockRepositoryState.rules['repo-1'],
        file_url:
          calls === 1 ? 'javascript:alert(1)' : mockRepositoryState.rules['repo-1'].file_url,
      })
    }
    const { container } = await renderLoaded('repo-1', api)
    const alert = await within(section('Rules')).findByRole('alert')
    expect(alert).toHaveTextContent('The rules could not be loaded.')
    expect(container.querySelector('a[href^="javascript:"]')).toBeNull()
    expect(within(section('Rules')).queryByText('Custom rules')).toBeNull()
    await userEvent.click(within(alert).getByRole('button', { name: 'Retry' }))
    expect(await within(section('Rules')).findByText('Custom rules')).toBeInTheDocument()
    expect(calls).toBe(2)
  })
})

describe('Review history section', () => {
  const base = mockAppState.server.run
  const run = (id: string, repository: string, createdAt: string, title = id) => ({
    ...base,
    run_id: id,
    title,
    repository,
    created_at: createdAt,
  })

  it('lists only this repository’s runs, newest first, linking to each run', async () => {
    const api: ReviewApi = {
      ...createMockReviewApi(),
      listRuns: () =>
        Promise.resolve([
          run('old', 'acme/web', '2026-10-01T10:00:00Z', 'Old change'),
          run('api', 'acme/api', '2026-10-05T10:00:00Z', 'API change'),
          run('new', 'acme/web', '2026-10-07T10:00:00Z', 'New change'),
        ]),
    }
    await renderLoaded('repo-1', api)
    const list = await within(section('Review history')).findByRole('list', {
      name: 'Review runs of this repository',
    })
    const links = within(list).getAllByRole('link')
    expect(links.map((link) => link.getAttribute('href'))).toEqual(['/runs/new', '/runs/old'])
    expect(links[0]).toHaveTextContent('New change')
    expect(links[0]).toHaveTextContent('Pull request #42')
    expect(links[0]).toHaveTextContent('Run: Completed')
    expect(links[0]).toHaveTextContent('Coverage: Partial')
    expect(links[0]).toHaveTextContent('Oct 7, 2026, 10:00 AM UTC')
    expect(section('Review history')).not.toHaveTextContent('API change')
  })

  it('shows the mock run on the demo repository', async () => {
    await renderLoaded('repo-4')
    expect(
      await within(section('Review history')).findByRole('link', {
        name: /Add user search endpoint/,
      }),
    ).toHaveAttribute('href', `/runs/${base.run_id}`)
  })

  it('says when no reviews have run', async () => {
    await renderLoaded('repo-2')
    expect(
      await within(section('Review history')).findByText(
        'No reviews have run on this repository yet.',
      ),
    ).toBeInTheDocument()
  })

  it('shows a loading state', async () => {
    await renderLoaded('repo-1', { ...createMockReviewApi(), listRuns: never })
    expect(
      await within(section('Review history')).findByText('Loading review history…'),
    ).toBeInTheDocument()
  })

  it('fails on its own with Retry', async () => {
    const api = createMockReviewApi({ failures: ['listRuns'] })
    await renderLoaded('repo-4', api)
    const alert = await within(section('Review history')).findByRole('alert')
    expect(alert).toHaveTextContent('The review history could not be loaded.')
    expect(
      await within(section('Review settings')).findByRole('switch', { name: 'Automatic review' }),
    ).toBeInTheDocument()
    api.setFailure('listRuns', false)
    await act(() => userEvent.click(within(alert).getByRole('button', { name: 'Retry' })))
    expect(
      await within(section('Review history')).findByRole('link', { name: /Add user search/ }),
    ).toBeInTheDocument()
  })
})

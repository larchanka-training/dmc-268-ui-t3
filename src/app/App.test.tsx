import type { QueryClient } from '@tanstack/react-query'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi, type MockInstance } from 'vitest'
import { diffViewStore } from '@/entities/diff'
import { findingNavStore } from '@/entities/finding'
import { sessionStore } from '@/entities/session'
import { SIGN_IN_ATTEMPT_KEY } from '@/features/auth-by-github'
import type { ReviewApi } from '@/shared/api'
import { createMockAuthApi, MOCK_REFRESH_KEY, MOCK_USER } from '@/shared/api/auth/mock-auth-api'
import { mockAppState, RUN_ID } from '@/shared/api/mock/app-state.mock'
import { createMockReviewApi } from '@/shared/api/mock/mock-review-api'
import type { ConfigResult } from '@/shared/config/env'
import { App } from './App'
import { createQueryClient } from './providers/query-client'

const config: ConfigResult = {
  ok: true,
  config: {
    authMode: 'mock',
    githubClientId: null,
    githubRedirectUri: 'http://localhost:3000/auth/callback',
    apiBaseUrl: '/api',
    githubAppInstallUrl: null,
  },
}

const RUN_TITLE = mockAppState.server.run.title

/** Renders the whole app at `path` with the browser history, as in production. */
function renderApp(path: string, queryClient?: QueryClient) {
  window.history.replaceState(null, '', path)
  const getRunCalls: MockInstance<ReviewApi['getRun']>[] = []
  const createReviewApi = vi.fn((user: { login: string }) => {
    const api = createMockReviewApi({ author: user.login })
    getRunCalls.push(vi.spyOn(api, 'getRun'))
    return api
  })
  const view = render(
    <App
      config={config}
      authApi={createMockAuthApi()}
      createReviewApi={createReviewApi}
      queryClient={queryClient}
    />,
  )
  return { ...view, createReviewApi, getRunCalls }
}

function storeMockSession() {
  sessionStorage.setItem(MOCK_REFRESH_KEY, JSON.stringify(MOCK_USER))
}

function currentPath() {
  return `${window.location.pathname}${window.location.search}`
}

beforeEach(() => {
  sessionStorage.clear()
  localStorage.clear()
  sessionStore.getState().actions.reset()
  diffViewStore.getState().actions.reset()
  findingNavStore.getState().actions.reset()
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('App session gate', () => {
  it('shows the shell placeholder while restoring, then sign-in without review data', async () => {
    const { createReviewApi } = renderApp('/runs')
    expect(await screen.findByRole('status')).toHaveTextContent('Restoring your session…')
    expect(await screen.findByRole('button', { name: 'Sign in with GitHub' })).toBeInTheDocument()
    expect(screen.queryByRole('navigation', { name: 'Main' })).not.toBeInTheDocument()
    expect(createReviewApi).not.toHaveBeenCalled()
  })

  it('restores a stored session and shows the run inside the shell', async () => {
    storeMockSession()
    const { getRunCalls } = renderApp(`/runs/${RUN_ID}`)
    expect(await screen.findByRole('region', { name: 'Review summary' })).toBeVisible()
    expect(screen.getByRole('navigation', { name: 'Main' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Account: octocat' })).toBeInTheDocument()
    expect(getRunCalls[0]).toHaveBeenCalled()
  })

  it('attributes replies to the signed-in GitHub login', async () => {
    storeMockSession()
    renderApp(`/runs/${RUN_ID}`)
    const card = await screen.findByRole('article', {
      name: 'Finding: DEBUG is enabled in shared settings',
    })
    await userEvent.type(within(card).getByRole('textbox', { name: 'Reply' }), 'Agreed')
    await userEvent.click(within(card).getByRole('button', { name: 'Reply' }))
    const replies = await within(card).findByRole('list', { name: 'Replies' })
    expect(within(replies).getAllByText('octocat').length).toBeGreaterThan(0)
  })

  it('signs out from the user menu and clears cached review data', async () => {
    storeMockSession()
    const queryClient = createQueryClient()
    renderApp(`/runs/${RUN_ID}`, queryClient)
    await screen.findByRole('region', { name: 'Review summary' })
    expect(queryClient.getQueryCache().getAll().length).toBeGreaterThan(0)

    await userEvent.click(screen.getByRole('button', { name: 'Account: octocat' }))
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Sign out' }))
    expect(await screen.findByRole('button', { name: 'Sign in with GitHub' })).toBeInTheDocument()
    expect(queryClient.getQueryCache().getAll()).toHaveLength(0)
  })

  it('clears the cache and explains when the session expires', async () => {
    storeMockSession()
    const queryClient = createQueryClient()
    renderApp(`/runs/${RUN_ID}`, queryClient)
    await screen.findByRole('region', { name: 'Review summary' })
    sessionStore.getState().actions.signOut('expired')
    await waitFor(() => {
      expect(screen.getByRole('status')).toHaveTextContent('Your session expired')
    })
    expect(queryClient.getQueryCache().getAll()).toHaveLength(0)
  })

  it('shows configuration errors instead of the sign-in button', async () => {
    window.history.replaceState(null, '', '/runs')
    render(
      <App
        config={{
          ok: false,
          issues: [{ variable: 'VITE_GITHUB_CLIENT_ID', message: 'is required' }],
        }}
        authApi={createMockAuthApi()}
      />,
    )
    expect(await screen.findByRole('alert')).toHaveTextContent('VITE_GITHUB_CLIENT_ID is required')
  })
})

describe('App routes', () => {
  it('redirects / to /repositories', async () => {
    storeMockSession()
    renderApp('/')
    expect(await screen.findByRole('heading', { name: 'Repositories' })).toBeInTheDocument()
    expect(currentPath()).toBe('/repositories')
  })

  it('lands a signed-out user who opens / on /repositories after signing in', async () => {
    const first = renderApp('/')
    const signIn = await screen.findByRole('button', { name: 'Sign in with GitHub' })
    expect(currentPath()).toBe('/repositories')
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    await userEvent.click(signIn)
    await waitFor(() => {
      expect(sessionStorage.getItem(SIGN_IN_ATTEMPT_KEY)).not.toBeNull()
    })
    const attempt = JSON.parse(sessionStorage.getItem(SIGN_IN_ATTEMPT_KEY) ?? '{}') as {
      state: string
      returnTo: string
    }
    expect(attempt.returnTo).toBe('/repositories')
    first.unmount()

    renderApp(`/auth/callback?code=mock-1&state=${attempt.state}`)
    expect(await screen.findByRole('list', { name: 'Connected repositories' })).toBeInTheDocument()
    expect(currentPath()).toBe('/repositories')
  })

  it('redirects a legacy ?run= link to the run page', async () => {
    storeMockSession()
    renderApp(`/?run=${RUN_ID}`)
    expect(await screen.findByRole('region', { name: 'Review summary' })).toBeVisible()
    expect(currentPath()).toBe(`/runs/${RUN_ID}`)
  })

  it('shows sign-in at the new URL for a signed-out legacy link and keeps it as the return path', async () => {
    renderApp('/?run=abc')
    const signIn = await screen.findByRole('button', { name: 'Sign in with GitHub' })
    expect(currentPath()).toBe('/runs/abc')
    // jsdom cannot navigate away; the attempt is stored before the redirect.
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    await userEvent.click(signIn)
    await waitFor(() => {
      expect(sessionStorage.getItem(SIGN_IN_ATTEMPT_KEY)).not.toBeNull()
    })
    expect(JSON.parse(sessionStorage.getItem(SIGN_IN_ATTEMPT_KEY) ?? '{}')).toMatchObject({
      returnTo: '/runs/abc',
    })
  })

  it('completes the callback through the router and lands on the run', async () => {
    sessionStorage.setItem(
      SIGN_IN_ATTEMPT_KEY,
      JSON.stringify({ state: 's1', verifier: 'v1', returnTo: `/runs/${RUN_ID}` }),
    )
    renderApp('/auth/callback?code=mock-1&state=s1')
    expect(await screen.findByRole('region', { name: 'Review summary' })).toBeVisible()
    expect(currentPath()).toBe(`/runs/${RUN_ID}`)
    // The router saw the navigation too: the sidebar marks the run as the current page.
    expect(screen.getByRole('link', { name: RUN_TITLE })).toHaveAttribute('aria-current', 'page')
  })

  it('navigates between pages without a reload and updates the title', async () => {
    storeMockSession()
    renderApp('/runs')
    await screen.findByRole('heading', { name: 'Review runs' })
    expect(document.title).toBe('Review runs · AI code review')

    const nav = screen.getByRole('navigation', { name: 'Main' })
    await userEvent.click(within(nav).getByRole('link', { name: 'Settings' }))
    expect(await screen.findByRole('heading', { name: 'Settings' })).toBeInTheDocument()
    expect(currentPath()).toBe('/settings')
    expect(document.title).toBe('Settings · AI code review')
    expect(within(nav).getByRole('link', { name: 'Settings' })).toHaveAttribute(
      'aria-current',
      'page',
    )
  })

  it('titles the repository pages', async () => {
    storeMockSession()
    renderApp('/repositories')
    await screen.findByRole('list', { name: 'Connected repositories' })
    expect(document.title).toBe('Repositories · AI code review')
    await userEvent.click(screen.getByRole('link', { name: 'Connect repository' }))
    expect(await screen.findByRole('heading', { name: 'Connect repository' })).toBeInTheDocument()
    expect(currentPath()).toBe('/repositories/connect')
    expect(document.title).toBe('Connect repository · AI code review')
  })

  it('requests no repository data while signed out', async () => {
    const { createReviewApi } = renderApp('/repositories')
    expect(await screen.findByRole('button', { name: 'Sign in with GitHub' })).toBeInTheDocument()
    expect(createReviewApi).not.toHaveBeenCalled()
  })

  it('connects a repository and shows it in the list', async () => {
    storeMockSession()
    renderApp('/repositories/connect')
    await screen.findByRole('list', { name: 'Accessible repositories' })
    await userEvent.click(screen.getByRole('button', { name: 'Connect acme/docs' }))
    const list = await screen.findByRole('list', { name: 'Connected repositories' })
    expect(currentPath()).toBe('/repositories')
    expect(within(list).getByText('acme/docs')).toBeInTheDocument()
  })

  it('opens a run from the list', async () => {
    storeMockSession()
    renderApp('/runs')
    const list = await screen.findByRole('list', { name: 'Review runs' })
    await userEvent.click(within(list).getByRole('link', { name: new RegExp(RUN_TITLE) }))
    expect(await screen.findByRole('region', { name: 'Review summary' })).toBeVisible()
    expect(currentPath()).toBe(`/runs/${RUN_ID}`)
  })

  it('shows not-found inside the shell for an unknown path', async () => {
    storeMockSession()
    renderApp('/nope')
    const main = await screen.findByRole('main')
    expect(await within(main).findByRole('heading', { name: 'Page not found' })).toBeInTheDocument()
    expect(within(main).getByRole('link', { name: 'Review runs' })).toHaveAttribute('href', '/runs')
    expect(screen.getByRole('navigation', { name: 'Main' })).toBeInTheDocument()
    expect(document.title).toBe('Page not found · AI code review')
  })
})

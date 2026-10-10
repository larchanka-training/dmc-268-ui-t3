import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { sessionStore } from '@/entities/session'
import { ApiError, type AuthApi } from '@/shared/api'
import { createMockAuthApi } from '@/shared/api/auth/mock-auth-api'
import { renderWithProviders } from '@/shared/lib/test/render'
import { renderWithRouter } from '@/shared/lib/test/render-with-router'
import { startGithubSignIn } from '../model/start-github-sign-in'
import { SignInButton } from './SignInButton'
import { UserMenu } from './UserMenu'

// jsdom cannot navigate; the redirect itself is covered by start-github-sign-in.test.ts.
vi.mock('../model/start-github-sign-in', () => ({
  startGithubSignIn: vi.fn(() => new Promise(() => undefined)),
}))

function signIn() {
  sessionStore.getState().actions.signIn({
    accessToken: 'jwt-1',
    expiresAt: Date.now() + 60_000,
    user: {
      id: 1,
      login: 'octocat',
      name: 'The Octocat',
      avatarUrl: 'https://example.com/a.png',
    },
  })
}

describe('SignInButton', () => {
  it('starts sign-in and shows the redirecting state', async () => {
    renderWithProviders(
      <SignInButton
        config={{
          authMode: 'mock',
          githubClientId: null,
          githubRedirectUri: 'http://localhost:3000/auth/callback',
          apiBaseUrl: '/api',
          githubAppInstallUrl: null,
        }}
      />,
    )
    await userEvent.click(screen.getByRole('button', { name: 'Sign in with GitHub' }))
    expect(screen.getByRole('button', { name: 'Redirecting to GitHub…' })).toBeDisabled()
    expect(startGithubSignIn).toHaveBeenCalledTimes(1)
  })
})

describe('UserMenu', () => {
  beforeEach(() => {
    sessionStore.getState().actions.reset()
    signIn()
  })

  async function openMenu() {
    await userEvent.click(screen.getByRole('button', { name: 'Account: octocat' }))
    return screen.findByRole('menu')
  }

  it('shows the avatar and login, and the name and @login in the menu', async () => {
    await renderWithRouter(<UserMenu />)
    const trigger = screen.getByRole('button', { name: 'Account: octocat' })
    expect(trigger.querySelector('img')).toHaveAttribute('src', 'https://example.com/a.png')
    const menu = await openMenu()
    expect(menu).toHaveTextContent('The Octocat')
    expect(menu).toHaveTextContent('@octocat')
    expect(within(menu).getByRole('menuitem', { name: 'Settings' })).toHaveAttribute(
      'href',
      '/settings',
    )
  })

  it('calls logout with the token, ends the session and reports it', async () => {
    const authApi = createMockAuthApi()
    const logout = vi.spyOn(authApi, 'logout')
    const onSignedOut = vi.fn()
    await renderWithRouter(<UserMenu onSignedOut={onSignedOut} />, { authApi })

    const menu = await openMenu()
    await userEvent.click(within(menu).getByRole('menuitem', { name: 'Sign out' }))
    await waitFor(() => {
      expect(onSignedOut).toHaveBeenCalledTimes(1)
    })
    expect(logout).toHaveBeenCalledWith('jwt-1')
    expect(sessionStore.getState()).toMatchObject({ status: 'signed-out', session: null })
  })

  it('signs out with the keyboard', async () => {
    await renderWithRouter(<UserMenu />)
    screen.getByRole('button', { name: 'Account: octocat' }).focus()
    await userEvent.keyboard('{Enter}')
    await screen.findByRole('menu')
    // Items: Settings, Sign out.
    await userEvent.keyboard('{ArrowDown}{Enter}')
    await waitFor(() => {
      expect(sessionStore.getState().status).toBe('signed-out')
    })
  })

  it('ends the local session even when logout fails', async () => {
    const authApi: AuthApi = {
      ...createMockAuthApi(),
      logout: () => Promise.reject(new ApiError('Down', 503)),
    }
    const onSignedOut = vi.fn()
    await renderWithRouter(<UserMenu onSignedOut={onSignedOut} />, { authApi })
    const menu = await openMenu()
    await userEvent.click(within(menu).getByRole('menuitem', { name: 'Sign out' }))
    await waitFor(() => {
      expect(sessionStore.getState().status).toBe('signed-out')
    })
    expect(onSignedOut).toHaveBeenCalledTimes(1)
  })
})

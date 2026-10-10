import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { sessionStore } from '@/entities/session'
import { renderWithProviders } from '@/shared/lib/test/render'
import { renderWithRouter } from '@/shared/lib/test/render-with-router'
import { AppShell, ShellSkeleton } from './AppShell'
import { Header } from './Header'

function signIn() {
  sessionStore.getState().actions.signIn({
    accessToken: 'jwt',
    expiresAt: Date.now() + 60_000,
    user: { id: 1, login: 'octocat', name: 'The Octocat', avatarUrl: 'https://example.com/a.png' },
  })
}

describe('AppShell', () => {
  beforeEach(() => {
    localStorage.clear()
    signIn()
  })

  it('exposes the navigation, banner and main landmarks', async () => {
    await renderWithRouter(
      <AppShell authMode="github">
        <p>Page content</p>
      </AppShell>,
      { path: '/runs' },
    )
    expect(screen.getByRole('navigation', { name: 'Main' })).toBeInTheDocument()
    expect(screen.getByRole('banner')).toBeInTheDocument()
    expect(screen.getByRole('main')).toHaveTextContent('Page content')
  })

  it('puts the skip link first in tab order and moves focus to main', async () => {
    await renderWithRouter(
      <AppShell authMode="github">
        <p>Page content</p>
      </AppShell>,
    )
    await userEvent.tab()
    const skip = screen.getByRole('link', { name: 'Skip to content' })
    expect(skip).toHaveFocus()
    await userEvent.keyboard('{Enter}')
    expect(screen.getByRole('main')).toHaveFocus()
  })
})

describe('Header', () => {
  beforeEach(() => {
    signIn()
  })

  it('opens the navigation drawer, closes it on navigation and restores focus', async () => {
    const { router } = await renderWithRouter(<Header authMode="github" />, { path: '/runs' })
    const menuButton = screen.getByRole('button', { name: 'Open navigation' })
    await userEvent.click(menuButton)

    const drawer = await screen.findByRole('dialog')
    await userEvent.click(within(drawer).getByRole('link', { name: 'Settings' }))
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })
    expect(router.state.location.pathname).toBe('/settings')
    await waitFor(() => {
      expect(menuButton).toHaveFocus()
    })
  })

  it('closes the drawer with Escape', async () => {
    await renderWithRouter(<Header authMode="github" />)
    const menuButton = screen.getByRole('button', { name: 'Open navigation' })
    await userEvent.click(menuButton)
    await screen.findByRole('dialog')
    await userEvent.keyboard('{Escape}')
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })
    await waitFor(() => {
      expect(menuButton).toHaveFocus()
    })
  })

  it('shows the Mock auth badge only in mock mode', async () => {
    const { unmount } = await renderWithRouter(<Header authMode="mock" />)
    expect(screen.getByText('Mock auth')).toBeInTheDocument()
    unmount()
    await renderWithRouter(<Header authMode="github" />)
    expect(screen.queryByText('Mock auth')).not.toBeInTheDocument()
  })

  it('shows the theme menu and the signed-in user', async () => {
    await renderWithRouter(<Header authMode="github" />)
    expect(screen.getByRole('button', { name: /^Theme:/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Account: octocat' })).toBeInTheDocument()
  })
})

describe('ShellSkeleton', () => {
  it('announces that the session is being restored', () => {
    renderWithProviders(<ShellSkeleton />)
    expect(screen.getByRole('status')).toHaveTextContent('Restoring your session…')
  })
})

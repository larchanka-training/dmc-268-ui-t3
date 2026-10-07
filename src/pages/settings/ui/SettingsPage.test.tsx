import { screen, within } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { sessionStore } from '@/entities/session'
import { renderWithProviders } from '@/shared/lib/test/render'
import { SettingsPage } from './SettingsPage'

describe('SettingsPage', () => {
  beforeEach(() => {
    sessionStore.getState().actions.signIn({
      accessToken: 'jwt',
      expiresAt: Date.now() + 60_000,
      user: {
        id: 1,
        login: 'octocat',
        name: 'The Octocat',
        avatarUrl: 'https://example.com/a.png',
      },
    })
  })

  it('shows the theme control and the mock account', () => {
    renderWithProviders(<SettingsPage authMode="mock" />)
    const appearance = screen.getByRole('region', { name: 'Appearance' })
    expect(within(appearance).getByRole('radiogroup', { name: 'Theme' })).toBeInTheDocument()

    const account = screen.getByRole('region', { name: 'Account' })
    expect(account).toHaveTextContent('@octocat')
    expect(account).toHaveTextContent('The Octocat')
    expect(account).toHaveTextContent('Mock authentication is in use')
  })

  it('states GitHub sign-in in github mode', () => {
    renderWithProviders(<SettingsPage authMode="github" />)
    expect(screen.getByRole('region', { name: 'Account' })).toHaveTextContent(
      'Signed in with GitHub.',
    )
  })
})

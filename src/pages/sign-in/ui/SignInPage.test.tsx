import { screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { sessionStore } from '@/entities/session'
import type { ConfigResult } from '@/shared/config/env'
import { renderWithProviders } from '@/shared/lib/test/render'
import { SignInPage } from './SignInPage'

const ok: ConfigResult = {
  ok: true,
  config: {
    authMode: 'github',
    githubClientId: 'Iv23liAbCdEf123456',
    githubRedirectUri: 'https://review.example.com/auth/callback',
    apiBaseUrl: '/api',
    githubAppInstallUrl: null,
  },
}

describe('SignInPage', () => {
  beforeEach(() => {
    sessionStore.getState().actions.reset()
  })

  it('offers sign-in with GitHub and a theme switcher', () => {
    sessionStore.getState().actions.signOut()
    renderWithProviders(<SignInPage config={ok} />)
    expect(screen.getByRole('button', { name: 'Sign in with GitHub' })).toBeEnabled()
    expect(screen.getByRole('radiogroup', { name: 'Theme' })).toBeInTheDocument()
    expect(screen.queryByText(/session expired/i)).not.toBeInTheDocument()
  })

  it('says the session expired after a rejected refresh', () => {
    sessionStore.getState().actions.signOut('expired')
    renderWithProviders(<SignInPage config={ok} />)
    expect(screen.getByRole('status')).toHaveTextContent('Your session expired')
  })

  it('lists invalid variables instead of a sign-in button', () => {
    renderWithProviders(
      <SignInPage
        config={{
          ok: false,
          issues: [
            { variable: 'VITE_GITHUB_CLIENT_ID', message: 'is required' },
            { variable: 'VITE_GITHUB_REDIRECT_URI', message: 'is required' },
          ],
        }}
      />,
    )
    const alert = screen.getByRole('alert')
    expect(alert).toHaveTextContent('VITE_GITHUB_CLIENT_ID is required')
    expect(alert).toHaveTextContent('VITE_GITHUB_REDIRECT_URI is required')
    expect(screen.queryByRole('button', { name: /sign in/i })).not.toBeInTheDocument()
    expect(screen.getByRole('radiogroup', { name: 'Theme' })).toBeInTheDocument()
  })
})

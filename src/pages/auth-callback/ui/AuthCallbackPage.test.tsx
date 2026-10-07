import { screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { sessionStore } from '@/entities/session'
import { SIGN_IN_ATTEMPT_KEY } from '@/features/auth-by-github'
import { ApiError, type AuthApi } from '@/shared/api'
import { createMockAuthApi } from '@/shared/api/auth/mock-auth-api'
import type { AppConfig } from '@/shared/config/env'
import { renderWithProviders } from '@/shared/lib/test/render'
import { AuthCallbackPage } from './AuthCallbackPage'

const config: AppConfig = {
  authMode: 'mock',
  githubClientId: null,
  githubRedirectUri: 'http://localhost:3000/auth/callback',
  apiBaseUrl: '/api',
}

function arrive(query: string) {
  sessionStorage.setItem(
    SIGN_IN_ATTEMPT_KEY,
    JSON.stringify({ state: 's1', verifier: 'v1', returnTo: '/?run=abc' }),
  )
  window.history.replaceState(null, '', `/auth/callback${query}`)
}

describe('AuthCallbackPage', () => {
  beforeEach(() => {
    sessionStorage.clear()
    sessionStore.getState().actions.reset()
  })

  it('shows progress, then hands the return path over', async () => {
    arrive('?code=mock-1&state=s1')
    const onSignedIn = vi.fn()
    renderWithProviders(<AuthCallbackPage config={config} onSignedIn={onSignedIn} />, {
      authApi: createMockAuthApi({ delayMs: 10 }),
    })
    expect(screen.getByRole('status')).toHaveTextContent('Signing you in…')
    await vi.waitFor(() => {
      expect(onSignedIn).toHaveBeenCalledWith('/?run=abc')
    })
  })

  it.each([
    ['?error=access_denied&state=s1', 'Sign-in was cancelled'],
    ['?code=mock-1&state=other', 'Sign-in could not be verified'],
  ])('shows an error with Try again for %s', async (query, title) => {
    arrive(query)
    renderWithProviders(<AuthCallbackPage config={config} onSignedIn={vi.fn()} />)
    expect(await screen.findByRole('alert')).toHaveTextContent(title)
    expect(screen.getByRole('button', { name: 'Try again' })).toBeEnabled()
  })

  it('shows a failure when the exchange is rejected', async () => {
    arrive('?code=mock-1&state=s1')
    const authApi: AuthApi = {
      ...createMockAuthApi(),
      exchange: () => Promise.reject(new ApiError('Bad gateway', 502)),
    }
    renderWithProviders(<AuthCallbackPage config={config} onSignedIn={vi.fn()} />, { authApi })
    expect(await screen.findByRole('alert')).toHaveTextContent('Sign-in failed')
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument()
  })
})

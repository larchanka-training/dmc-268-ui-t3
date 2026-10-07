import { Outlet } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import {
  refreshSession,
  sessionStore,
  useSessionRefreshScheduler,
  useSessionStatus,
  useSessionUser,
  type SessionUser,
} from '@/entities/session'
import { SignInPage } from '@/pages/sign-in'
import { ReviewApiProvider, useAuthApi, type ReviewApi } from '@/shared/api'
import type { AppConfig, ConfigResult } from '@/shared/config/env'
import { AppShell, ShellSkeleton } from '@/widgets/app-shell'

export type ReviewApiFactory = (user: SessionUser) => ReviewApi

interface SignedInLayoutProps {
  user: SessionUser
  config: AppConfig
  createReviewApi: ReviewApiFactory
}

/**
 * Everything behind sign-in. Rendered with `key={user.id}`, so a different
 * user gets a fresh ReviewApi; the matched page renders in the shell's main region.
 */
function SignedInLayout({ user, config, createReviewApi }: SignedInLayoutProps) {
  useSessionRefreshScheduler()
  const [api] = useState(() => createReviewApi(user))

  return (
    <ReviewApiProvider api={api}>
      <AppShell authMode={config.authMode}>
        <Outlet />
      </AppShell>
    </ReviewApiProvider>
  )
}

interface SessionGateProps {
  config: ConfigResult
  createReviewApi: ReviewApiFactory
}

/**
 * Restores the session once on page load through the refresh cookie, then
 * shows sign-in or the app. Review data is never requested while signed out.
 */
export function SessionGate({ config, createReviewApi }: SessionGateProps) {
  const authApi = useAuthApi()
  const status = useSessionStatus()
  const user = useSessionUser()

  useEffect(() => {
    if (sessionStore.getState().status !== 'restoring') return
    // refreshSession is single-flight, so StrictMode's second run shares the request.
    refreshSession(authApi).catch(() => undefined)
  }, [authApi])

  if (status === 'restoring') return <ShellSkeleton />
  if (!config.ok || status === 'signed-out' || !user) return <SignInPage config={config} />
  return (
    <SignedInLayout
      key={user.id}
      user={user}
      config={config.config}
      createReviewApi={createReviewApi}
    />
  )
}

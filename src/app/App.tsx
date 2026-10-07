import type { QueryClient } from '@tanstack/react-query'
import { RouterProvider, type RouterHistory } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { sessionStore } from '@/entities/session'
import type { AuthApi } from '@/shared/api'
import { createMockReviewApi, failuresFromSearch } from '@/shared/api/mock/mock-review-api'
import { parseEnv, type ConfigResult } from '@/shared/config/env'
import { createAuthApi } from './providers/auth-api'
import { AppProviders } from './providers/AppProviders'
import { createQueryClient } from './providers/query-client'
import { createAppRouter } from './router'
import type { ReviewApiFactory } from './ui/SessionGate'

/**
 * Until the backend review API exists the app runs on the mock adapter, with
 * replies attributed to the signed-in user.
 * Dev switch: `?mockFail=replyToFinding,setFindingStatus` forces failures.
 */
const createMockReviewApiFor: ReviewApiFactory = (user) =>
  createMockReviewApi({
    delayMs: 300,
    failures: failuresFromSearch(window.location.search),
    author: user.login,
  })

interface AppProps {
  /** Overrides for tests; production reads import.meta.env and the browser history. */
  config?: ConfigResult
  authApi?: AuthApi
  createReviewApi?: ReviewApiFactory
  queryClient?: QueryClient
  history?: RouterHistory
}

export function App({
  config: configOverride,
  authApi: authApiOverride,
  createReviewApi = createMockReviewApiFor,
  queryClient: queryClientOverride,
  history,
}: AppProps) {
  const [config] = useState(
    () => configOverride ?? parseEnv(import.meta.env, window.location.origin),
  )
  const [queryClient] = useState(() => queryClientOverride ?? createQueryClient())
  const [authApi] = useState(() => authApiOverride ?? createAuthApi(config))
  const [router] = useState(() =>
    createAppRouter({ history, context: { config, createReviewApi, queryClient } }),
  )

  // Cached review data belongs to the user; drop it whenever a session ends.
  useEffect(
    () =>
      sessionStore.subscribe((state, previous) => {
        if (state.status === 'signed-out' && previous.status === 'signed-in') queryClient.clear()
      }),
    [queryClient],
  )

  return (
    <AppProviders authApi={authApi} queryClient={queryClient}>
      <RouterProvider router={router} />
    </AppProviders>
  )
}

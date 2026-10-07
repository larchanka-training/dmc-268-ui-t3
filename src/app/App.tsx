import { useState } from 'react'
import { RUN_ID } from '@/shared/api/mock/app-state.mock'
import { createMockReviewApi, failuresFromSearch } from '@/shared/api/mock/mock-review-api'
import { ReviewRunPage } from '@/pages/review-run'
import { AppProviders } from './providers/AppProviders'
import { createQueryClient } from './providers/query-client'

/**
 * Until the backend API exists the app runs on the mock adapter.
 * Dev switches: `?run=<id>` opens another run, `?mockFail=replyToFinding,setFindingStatus` forces failures.
 */
export function App() {
  const [queryClient] = useState(createQueryClient)
  const [api] = useState(() =>
    createMockReviewApi({
      delayMs: 300,
      failures: failuresFromSearch(window.location.search),
      author: 'you',
    }),
  )
  const runId = new URLSearchParams(window.location.search).get('run') ?? RUN_ID

  return (
    <AppProviders api={api} queryClient={queryClient}>
      <main className="mx-auto max-w-6xl space-y-4 p-4">
        <ReviewRunPage runId={runId} />
      </main>
    </AppProviders>
  )
}

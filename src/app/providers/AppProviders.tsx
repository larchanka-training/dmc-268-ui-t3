import { QueryClientProvider, type QueryClient } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { ReviewApiProvider, type ReviewApi } from '@/shared/api'
import { TooltipProvider } from '@/shared/ui/tooltip'

interface AppProvidersProps {
  api: ReviewApi
  queryClient: QueryClient
  children: ReactNode
}

export function AppProviders({ api, queryClient, children }: AppProvidersProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <ReviewApiProvider api={api}>
        <TooltipProvider delayDuration={300}>{children}</TooltipProvider>
      </ReviewApiProvider>
    </QueryClientProvider>
  )
}

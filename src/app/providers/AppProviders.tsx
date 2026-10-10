import { QueryClientProvider, type QueryClient } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { AuthApiProvider, type AuthApi } from '@/shared/api'
import { TooltipProvider } from '@/shared/ui/tooltip'

interface AppProvidersProps {
  authApi: AuthApi
  queryClient: QueryClient
  children: ReactNode
}

/** App-wide providers. The ReviewApi is provided inside the signed-in shell, per user. */
export function AppProviders({ authApi, queryClient, children }: AppProvidersProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthApiProvider api={authApi}>
        <TooltipProvider delayDuration={300}>{children}</TooltipProvider>
      </AuthApiProvider>
    </QueryClientProvider>
  )
}

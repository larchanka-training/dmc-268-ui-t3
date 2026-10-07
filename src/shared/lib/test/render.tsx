import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, type RenderOptions } from '@testing-library/react'
import type { ReactElement, ReactNode } from 'react'
import { AuthApiProvider, ReviewApiProvider, type AuthApi, type ReviewApi } from '@/shared/api'
import { createMockAuthApi } from '@/shared/api/auth/mock-auth-api'
import { createMockReviewApi } from '@/shared/api/mock/mock-review-api'
import { TooltipProvider } from '@/shared/ui/tooltip'

export function createTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: Infinity },
      mutations: { retry: false },
    },
  })
}

interface ProviderOptions {
  api?: ReviewApi
  authApi?: AuthApi
  queryClient?: QueryClient
}

export function createWrapper({
  api = createMockReviewApi(),
  authApi = createMockAuthApi(),
  queryClient = createTestQueryClient(),
}: ProviderOptions = {}) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <AuthApiProvider api={authApi}>
          <ReviewApiProvider api={api}>
            <TooltipProvider>{children}</TooltipProvider>
          </ReviewApiProvider>
        </AuthApiProvider>
      </QueryClientProvider>
    )
  }
}

/** Renders a component inside the same providers the app uses, with a mock API by default. */
export function renderWithProviders(
  ui: ReactElement,
  options: ProviderOptions & Omit<RenderOptions, 'wrapper'> = {},
) {
  const { api, authApi, queryClient, ...renderOptions } = options
  return render(ui, { wrapper: createWrapper({ api, authApi, queryClient }), ...renderOptions })
}

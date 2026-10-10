import { createHttpAuthApi, type AuthApi } from '@/shared/api'
import { createMockAuthApi } from '@/shared/api/auth/mock-auth-api'
import type { ConfigResult } from '@/shared/config/env'

/** Picks the AuthApi adapter from VITE_AUTH_MODE; mock until the backend exists. */
export function createAuthApi(config: ConfigResult): AuthApi {
  if (config.ok && config.config.authMode === 'github') {
    return createHttpAuthApi(config.config.apiBaseUrl)
  }
  return createMockAuthApi({ delayMs: 300 })
}

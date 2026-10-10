import type { ReactNode } from 'react'
import type { AuthApi } from './auth-api'
import { AuthApiContext } from './auth-api-context'

interface AuthApiProviderProps {
  api: AuthApi
  children: ReactNode
}

export function AuthApiProvider({ api, children }: AuthApiProviderProps) {
  return <AuthApiContext.Provider value={api}>{children}</AuthApiContext.Provider>
}

import { createContext, useContext } from 'react'
import type { AuthApi } from './auth-api'

export const AuthApiContext = createContext<AuthApi | null>(null)

export function useAuthApi(): AuthApi {
  const api = useContext(AuthApiContext)
  if (!api) {
    throw new Error('useAuthApi must be used inside <AuthApiProvider>')
  }
  return api
}

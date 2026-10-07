import type { ReactNode } from 'react'
import type { ReviewApi } from './review-api'
import { ReviewApiContext } from './review-api-context'

interface ReviewApiProviderProps {
  api: ReviewApi
  children: ReactNode
}

export function ReviewApiProvider({ api, children }: ReviewApiProviderProps) {
  return <ReviewApiContext.Provider value={api}>{children}</ReviewApiContext.Provider>
}

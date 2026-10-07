import { createContext, useContext } from 'react'
import type { ReviewApi } from './review-api'

export const ReviewApiContext = createContext<ReviewApi | null>(null)

export function useReviewApi(): ReviewApi {
  const api = useContext(ReviewApiContext)
  if (!api) {
    throw new Error('useReviewApi must be used inside <ReviewApiProvider>')
  }
  return api
}

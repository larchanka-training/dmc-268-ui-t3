import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  reviewSettingsKeys,
  reviewSettingsSchema,
  type ReviewSettingsValues,
} from '@/entities/review-settings'
import { useReviewApi } from '@/shared/api'

/**
 * Replaces a repository's review settings. Not optimistic: the saved response is parsed
 * and written to the settings query, so the cache always holds what the server stored.
 */
export function useUpdateReviewSettings(repositoryId: string) {
  const api = useReviewApi()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (values: ReviewSettingsValues) =>
      reviewSettingsSchema.parse(
        await api.updateReviewSettings({
          repositoryId,
          settings: {
            auto_review: values.autoReview,
            branch_filter: values.branchFilter,
            severity_threshold: values.severityThreshold,
          },
        }),
      ),
    onSuccess: (saved) => {
      queryClient.setQueryData(reviewSettingsKeys.detail(repositoryId), saved)
    },
  })
}

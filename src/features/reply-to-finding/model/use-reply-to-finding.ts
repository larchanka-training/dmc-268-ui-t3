import { useMutation, useQueryClient } from '@tanstack/react-query'
import { findingKeys, replySchema, type Finding } from '@/entities/finding'
import { useReviewApi } from '@/shared/api'

interface ReplyInput {
  findingId: string
  body: string
}

/**
 * Posts a reply. Not optimistic: the reply joins the thread only after the
 * server accepts it, so a failed reply never appears as sent.
 */
export function useReplyToFinding(runId: string) {
  const api = useReviewApi()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ findingId, body }: ReplyInput) =>
      replySchema.parse(await api.replyToFinding({ runId, findingId, body })),
    onSuccess: (reply, { findingId }) => {
      queryClient.setQueryData<Finding[]>(findingKeys.list(runId), (findings) =>
        findings?.map((finding) =>
          finding.id === findingId ? { ...finding, replies: [...finding.replies, reply] } : finding,
        ),
      )
    },
  })
}

import { useId, useState, type FormEvent } from 'react'
import { Button } from '@/shared/ui/button'
import { Textarea } from '@/shared/ui/textarea'
import { useReplyToFinding } from '../model/use-reply-to-finding'

interface ReplyFormProps {
  runId: string
  findingId: string
}

export function ReplyForm({ runId, findingId }: ReplyFormProps) {
  const [draft, setDraft] = useState('')
  const reply = useReplyToFinding(runId)
  const hintId = useId()
  const body = draft.trim()

  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (body === '' || reply.isPending) return
    reply.mutate(
      { findingId, body },
      {
        onSuccess: () => {
          setDraft('')
        },
      },
    )
  }

  return (
    <form onSubmit={submit} className="space-y-2">
      <Textarea
        aria-label="Reply"
        aria-describedby={hintId}
        placeholder="Reply to this finding…"
        rows={2}
        value={draft}
        onChange={(event) => {
          setDraft(event.target.value)
        }}
      />
      <div className="flex flex-wrap items-center gap-2">
        <Button type="submit" size="sm" disabled={body === '' || reply.isPending}>
          {reply.isPending ? 'Sending…' : 'Reply'}
        </Button>
        <p id={hintId} className="text-xs text-muted-foreground">
          Replies stay in this review app and are not posted to the pull request.
        </p>
      </div>
      {reply.isError && (
        <p role="alert" className="text-sm text-destructive">
          The reply could not be sent. Your text is kept, so you can try again.
        </p>
      )}
    </form>
  )
}

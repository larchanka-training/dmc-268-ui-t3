import type { Reply } from '../model/schema'

const timeFormat = new Intl.DateTimeFormat('en', {
  dateStyle: 'medium',
  timeStyle: 'short',
  timeZone: 'UTC',
})

export function ReplyThread({ replies }: { replies: Reply[] }) {
  if (replies.length === 0) return null
  return (
    <ol aria-label="Replies" className="space-y-2 border-l-2 pl-3">
      {replies.map((reply) => (
        <li key={reply.id}>
          <p className="text-xs text-muted-foreground">
            <span className="font-semibold text-foreground">{reply.author}</span> ·{' '}
            <time dateTime={reply.createdAt}>
              {timeFormat.format(new Date(reply.createdAt))} UTC
            </time>
          </p>
          <p className="whitespace-pre-wrap break-words">{reply.body}</p>
        </li>
      ))}
    </ol>
  )
}

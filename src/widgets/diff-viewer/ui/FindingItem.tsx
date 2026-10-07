import { FindingCard, useSelectedFindingId, type Finding } from '@/entities/finding'
import { ReplyForm } from '@/features/reply-to-finding'
import { ResolveFindingToggle } from '@/features/resolve-finding'
import type { LineAnchor } from '@/shared/lib/line-anchor'

interface FindingItemProps {
  runId: string
  finding: Finding
  onRevealLine: (anchor: LineAnchor) => void
}

/** A finding card with the reply and resolve features attached. */
export function FindingItem({ runId, finding, onRevealLine }: FindingItemProps) {
  const selectedId = useSelectedFindingId()
  return (
    <FindingCard
      finding={finding}
      selected={selectedId === finding.id}
      onRelatedLineClick={onRevealLine}
      actions={<ResolveFindingToggle runId={runId} finding={finding} />}
      footer={<ReplyForm runId={runId} findingId={finding.id} />}
    />
  )
}

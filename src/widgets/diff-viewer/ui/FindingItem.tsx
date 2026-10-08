import {
  FindingCard,
  SuggestedChange,
  useSelectedFindingId,
  type Finding,
} from '@/entities/finding'
import { ReplyForm } from '@/features/reply-to-finding'
import { ResolveFindingToggle } from '@/features/resolve-finding'
import { languageFromPath } from '@/shared/lib/highlighter'
import type { LineAnchor } from '@/shared/lib/line-anchor'

/** Head-side text of lines `start`..`end` of the finding's file, or null when unknown. */
export type ResolveHeadLines = (start: number, end: number) => string[] | null

interface FindingItemProps {
  runId: string
  finding: Finding
  onRevealLine: (anchor: LineAnchor) => void
  /** Absent when the finding's file is not in the diff. */
  resolveHeadLines?: ResolveHeadLines
}

/** A finding card with the reply and resolve features and its suggested change attached. */
export function FindingItem({ runId, finding, onRevealLine, resolveHeadLines }: FindingItemProps) {
  const selectedId = useSelectedFindingId()
  const suggestion = finding.suggestedChange
  return (
    <FindingCard
      finding={finding}
      selected={selectedId === finding.id}
      onRelatedLineClick={onRevealLine}
      actions={<ResolveFindingToggle runId={runId} finding={finding} />}
      suggestion={
        suggestion && (
          <SuggestedChange
            suggestion={suggestion}
            originalLines={resolveHeadLines?.(suggestion.startLine, suggestion.endLine) ?? null}
            language={languageFromPath(finding.anchor.path)}
          />
        )
      }
      footer={<ReplyForm runId={runId} findingId={finding.id} />}
    />
  )
}

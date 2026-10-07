import { useDiffViewActions, type Gap, type GapExpansion } from '@/entities/diff'
import { Button } from '@/shared/ui/button'
import { CONTEXT_STEP, fullExpansion, stepExpansion } from '../model/expansion'

interface ExpandContextControlsProps {
  /** Store key of the gap (gapKey(runId, path, gap.index)). */
  storeKey: string
  gap: Gap
  /** Expansion currently applied to the gap. */
  expansion: GapExpansion
  hiddenCount: number
}

export function ExpandContextControls({
  storeKey,
  gap,
  expansion,
  hiddenCount,
}: ExpandContextControlsProps) {
  const { setGapExpansion } = useDiffViewActions()
  if (!gap.expandable) {
    return (
      <span className="text-muted-foreground">
        Full file content is unavailable, so these lines cannot be shown.
      </span>
    )
  }
  return (
    <span className="flex gap-1">
      {hiddenCount > CONTEXT_STEP && (
        <Button
          variant="ghost"
          size="xs"
          onClick={() => {
            setGapExpansion(storeKey, stepExpansion(gap, expansion, hiddenCount))
          }}
        >
          Expand {CONTEXT_STEP} lines
        </Button>
      )}
      <Button
        variant="ghost"
        size="xs"
        onClick={() => {
          setGapExpansion(storeKey, fullExpansion(gap, expansion))
        }}
      >
        Expand all
      </Button>
    </span>
  )
}

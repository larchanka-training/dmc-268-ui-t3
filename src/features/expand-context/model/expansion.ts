import type { Gap, GapExpansion } from '@/entities/diff'

/** Lines revealed by one "expand" step. */
export const CONTEXT_STEP = 20

/**
 * Next expansion after one step. The gap before the first hunk grows upwards
 * from the hunk; other gaps grow downwards from the previous hunk.
 */
export function stepExpansion(gap: Gap, current: GapExpansion, hiddenCount: number): GapExpansion {
  const step = Math.min(CONTEXT_STEP, hiddenCount)
  return gap.position === 'leading'
    ? { top: current.top, bottom: current.bottom + step }
    : { top: current.top + step, bottom: current.bottom }
}

export function fullExpansion(gap: Gap, current: GapExpansion): GapExpansion {
  return { top: gap.size - current.bottom, bottom: current.bottom }
}

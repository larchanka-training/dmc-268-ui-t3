export type Side = 'LEFT' | 'RIGHT'

/** A position in the reviewed change: LEFT is the base snapshot, RIGHT the head snapshot. */
export interface LineAnchor {
  path: string
  side: Side
  line: number
}

export function anchorKey({ path, side, line }: LineAnchor): string {
  return `${path}:${side}:${String(line)}`
}

/**
 * Attribute-safe token for an anchor. Rendered diff rows list the tokens of the
 * lines they show in `data-anchors` (a context row matches both sides).
 */
export function anchorToken(anchor: LineAnchor): string {
  return encodeURIComponent(anchorKey(anchor))
}

/** The rendered diff row that shows an anchored line, if any. */
export function findLineElement(
  anchor: LineAnchor,
  root: ParentNode = document,
): HTMLElement | null {
  return root.querySelector<HTMLElement>(`[data-anchors~="${anchorToken(anchor)}"]`)
}

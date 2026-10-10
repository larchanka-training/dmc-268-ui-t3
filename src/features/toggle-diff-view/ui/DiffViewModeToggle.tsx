import { useDiffViewActions, useDiffViewMode, type DiffViewMode } from '@/entities/diff'
import { ToggleGroup, ToggleGroupItem } from '@/shared/ui/toggle-group'

function isMode(value: string): value is DiffViewMode {
  return value === 'unified' || value === 'split'
}

/** Switches every file of the open diff between unified and split layout. */
export function DiffViewModeToggle() {
  const mode = useDiffViewMode()
  const { setMode } = useDiffViewActions()
  return (
    <ToggleGroup
      type="single"
      variant="outline"
      size="sm"
      value={mode}
      onValueChange={(value) => {
        if (isMode(value)) setMode(value)
      }}
      aria-label="Diff view mode"
    >
      <ToggleGroupItem value="unified">Unified</ToggleGroupItem>
      <ToggleGroupItem value="split">Split</ToggleGroupItem>
    </ToggleGroup>
  )
}

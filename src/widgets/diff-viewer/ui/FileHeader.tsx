import { ChevronDown, ChevronRight } from 'lucide-react'
import { filePath, type ChangeType, type DiffFile } from '@/entities/diff'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'

const CHANGE_LABEL: Record<ChangeType, string> = {
  added: 'Added',
  deleted: 'Deleted',
  modified: 'Modified',
  renamed: 'Renamed',
}

interface FileHeaderProps {
  file: DiffFile
  collapsed: boolean
  onToggle: () => void
}

export function FileHeader({ file, collapsed, onToggle }: FileHeaderProps) {
  const path = filePath(file)
  return (
    <header className="sticky top-0 z-10 flex flex-wrap items-center gap-2 border-b bg-muted px-3 py-2">
      <Button
        variant="ghost"
        size="icon-xs"
        aria-expanded={!collapsed}
        aria-label={collapsed ? `Expand ${path}` : `Collapse ${path}`}
        onClick={onToggle}
      >
        {collapsed ? <ChevronRight /> : <ChevronDown />}
      </Button>
      <h2 className="min-w-0 break-all font-mono text-sm font-semibold">
        {file.changeType === 'renamed' ? `${file.oldPath ?? ''} → ${file.newPath ?? ''}` : path}
      </h2>
      <Badge variant="outline">{CHANGE_LABEL[file.changeType]}</Badge>
      {file.isBinary && <Badge variant="secondary">Binary</Badge>}
      <span className="ml-auto font-mono text-xs font-semibold">
        <span className="text-diff-add-foreground">+{file.additions}</span>{' '}
        <span className="text-diff-del-foreground">−{file.deletions}</span>
        <span className="sr-only">
          {' '}
          ({file.additions} added, {file.deletions} removed lines)
        </span>
      </span>
    </header>
  )
}

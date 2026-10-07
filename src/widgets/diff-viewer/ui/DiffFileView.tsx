import { useMemo } from 'react'
import {
  filePath,
  toContentLines,
  useDiffViewActions,
  useFileCollapsed,
  useFileContent,
  type DiffFile,
} from '@/entities/diff'
import type { Finding } from '@/entities/finding'
import type { LineAnchor } from '@/shared/lib/line-anchor'
import { LARGE_FILE_CHANGED_LINES } from '../model/constants'
import { FileBody, UnplacedFindings } from './FileBody'
import { FileHeader } from './FileHeader'

interface DiffFileViewProps {
  runId: string
  file: DiffFile
  findings: Finding[]
  onRevealLine: (anchor: LineAnchor) => void
}

export function DiffFileView({ runId, file, findings, onRevealLine }: DiffFileViewProps) {
  const path = filePath(file)
  const collapsed = useFileCollapsed(
    path,
    file.additions + file.deletions > LARGE_FILE_CHANGED_LINES,
  )
  const { setFileCollapsed } = useDiffViewActions()
  const hasHeadContent = !file.isBinary && file.changeType !== 'deleted' && file.hunks.length > 0
  const content = useFileContent(runId, !collapsed && hasHeadContent ? file.newPath : null)
  const contentLines = useMemo(() => toContentLines(content.data), [content.data])

  return (
    <section aria-label={`File ${path}`} className="overflow-clip rounded-md border">
      <FileHeader
        file={file}
        collapsed={collapsed}
        onToggle={() => {
          setFileCollapsed(path, !collapsed)
        }}
      />
      {!collapsed &&
        (file.isBinary || file.hunks.length === 0 ? (
          <>
            <p className="px-3 py-4 text-sm text-muted-foreground">
              {file.isBinary ? 'Binary file not shown.' : 'No content changes.'}
            </p>
            {findings.length > 0 && (
              <UnplacedFindings runId={runId} findings={findings} onRevealLine={onRevealLine} />
            )}
          </>
        ) : (
          <FileBody
            runId={runId}
            file={file}
            contentLines={contentLines}
            contentPending={content.isPending && content.fetchStatus !== 'idle'}
            findings={findings}
            onRevealLine={onRevealLine}
          />
        ))}
    </section>
  )
}

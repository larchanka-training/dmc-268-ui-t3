import { useCallback, useEffect } from 'react'
import { anchorBelongsToFile, filePath, useDiffViewActions, type DiffFile } from '@/entities/diff'
import {
  findingElementId,
  useFindingNavActions,
  useLineFlash,
  useSelectedFindingId,
  type Finding,
} from '@/entities/finding'
import { DiffViewModeToggle } from '@/features/toggle-diff-view'
import { findLineElement, type LineAnchor } from '@/shared/lib/line-anchor'
import { DiffFileView } from './DiffFileView'
import { UnplacedFindings } from './FileBody'

const FLASH_MS = 2000

interface DiffViewerProps {
  runId: string
  files: DiffFile[]
  findings: Finding[]
}

/** Scrolls to the flashed line and the selected finding, and clears the flash after a moment. */
function useNavigationScroll() {
  const flash = useLineFlash()
  const selectedId = useSelectedFindingId()
  const { clearFlash } = useFindingNavActions()

  useEffect(() => {
    if (!flash) return
    findLineElement(flash.anchor)?.scrollIntoView({ block: 'center', behavior: 'smooth' })
    const timer = setTimeout(() => {
      clearFlash(flash.token)
    }, FLASH_MS)
    return () => {
      clearTimeout(timer)
    }
  }, [flash, clearFlash])

  useEffect(() => {
    if (selectedId === null) return
    document
      .getElementById(findingElementId(selectedId))
      ?.scrollIntoView({ block: 'center', behavior: 'smooth' })
  }, [selectedId])
}

export function DiffViewer({ runId, files, findings }: DiffViewerProps) {
  const { setFileCollapsed } = useDiffViewActions()
  const { flashLine } = useFindingNavActions()
  useNavigationScroll()

  const revealLine = useCallback(
    (anchor: LineAnchor) => {
      const file = files.find((item) => anchorBelongsToFile(item, anchor))
      if (file) setFileCollapsed(filePath(file), false)
      flashLine(anchor)
    },
    [files, setFileCollapsed, flashLine],
  )

  const outside = findings.filter(
    (finding) => !files.some((file) => anchorBelongsToFile(file, finding.anchor)),
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          {files.length} changed {files.length === 1 ? 'file' : 'files'}
        </p>
        <DiffViewModeToggle />
      </div>
      {files.length === 0 && (
        <p className="rounded-md border p-4 text-sm">This diff has no changed files.</p>
      )}
      {files.map((file) => (
        <DiffFileView
          key={filePath(file)}
          runId={runId}
          file={file}
          findings={findings.filter((finding) => anchorBelongsToFile(file, finding.anchor))}
          onRevealLine={revealLine}
        />
      ))}
      {outside.length > 0 && (
        <div className="rounded-md border">
          <UnplacedFindings runId={runId} findings={outside} onRevealLine={revealLine} />
        </div>
      )}
    </div>
  )
}

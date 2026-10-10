import { anchorBelongsToFile, type DiffFile } from '@/entities/diff'
import { SEVERITIES, type Finding } from '@/entities/finding'

/**
 * Reading order for next/previous navigation: by file in diff order, then by
 * line, then by severity. Findings outside the diff come last.
 */
export function orderFindings(files: readonly DiffFile[], findings: readonly Finding[]): Finding[] {
  const fileIndex = (finding: Finding) => {
    const index = files.findIndex((file) => anchorBelongsToFile(file, finding.anchor))
    return index === -1 ? files.length : index
  }
  return [...findings].sort(
    (a, b) =>
      fileIndex(a) - fileIndex(b) ||
      a.anchor.line - b.anchor.line ||
      SEVERITIES.indexOf(a.severity) - SEVERITIES.indexOf(b.severity),
  )
}

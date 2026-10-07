import { parseUnifiedDiff, type DiffFile } from '@/entities/diff'
import { findingListSchema, type Finding } from '@/entities/finding'
import type { FindingWire } from '@/shared/api'
import { mockAppState } from '@/shared/api/mock/app-state.mock'

export const RUN = mockAppState.server.run.run_id

export function parseFiles(text: string): DiffFile[] {
  const result = parseUnifiedDiff(text)
  if (!result.ok) throw new Error(result.error.message)
  return result.files
}

export function toFindings(wire: FindingWire[]): Finding[] {
  return findingListSchema.parse(wire)
}

export const fixtureFiles = parseFiles(mockAppState.server.diffText)
export const fixtureFindings = toFindings(mockAppState.server.findings)

/** 100-line file with one changed line (51): a 50-line gap before the hunk... */
export const longFileContent =
  Array.from({ length: 100 }, (_, i) => `line ${String(i + 1)}`).join('\n') + '\n'
export const longFileDiff = [
  'diff --git a/long.ts b/long.ts',
  '--- a/long.ts',
  '+++ b/long.ts',
  '@@ -51 +51 @@',
  '-old 51',
  '+line 51',
  '',
].join('\n')

export function finding(
  overrides: Partial<FindingWire> & Pick<FindingWire, 'finding_id' | 'anchor'>,
): FindingWire {
  return {
    rule_id: 'TEST-1',
    title: `Finding ${overrides.finding_id}`,
    severity: 'medium',
    related_changed_lines: [overrides.anchor],
    evidence: 'evidence',
    impact: 'impact',
    recommendation: 'recommendation',
    confidence: 0.5,
    status: 'open',
    replies: [],
    ...overrides,
  }
}

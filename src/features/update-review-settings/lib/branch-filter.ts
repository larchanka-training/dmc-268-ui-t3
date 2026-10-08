export const MAX_PATTERN_LENGTH = 255

export interface BranchFilterResult {
  /** Trimmed patterns in the order entered, without empty lines. */
  patterns: string[]
  /** One message per invalid pattern, naming it; saving is blocked while any exist. */
  problems: string[]
}

/**
 * Parses the branch filter text: one pattern per line. Glob syntax is not checked here;
 * the backend owns matching and rejects what it cannot use.
 */
export function parseBranchFilter(text: string): BranchFilterResult {
  const patterns = text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
  const problems: string[] = []
  const seen = new Set<string>()
  const repeated = new Set<string>()
  for (const pattern of patterns) {
    if (/\s/.test(pattern)) {
      problems.push(`“${pattern}” contains whitespace.`)
    } else if (pattern.length > MAX_PATTERN_LENGTH) {
      problems.push(
        `“${pattern.slice(0, 40)}…” is longer than ${String(MAX_PATTERN_LENGTH)} characters.`,
      )
    }
    if (seen.has(pattern) && !repeated.has(pattern)) {
      repeated.add(pattern)
      problems.push(`“${pattern}” is repeated.`)
    }
    seen.add(pattern)
  }
  return { patterns, problems }
}

export function formatBranchFilter(patterns: readonly string[]): string {
  return patterns.join('\n')
}

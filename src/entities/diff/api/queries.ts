import { useQuery } from '@tanstack/react-query'
import { z } from 'zod'
import { useReviewApi } from '@/shared/api'
import { parseUnifiedDiff } from '../lib/parse-unified-diff'
import type { DiffParseError } from '../model/types'

export class DiffParseFailure extends Error {
  readonly detail: DiffParseError

  constructor(detail: DiffParseError) {
    super(`The diff could not be parsed (line ${String(detail.line)}): ${detail.message}`)
    this.name = 'DiffParseFailure'
    this.detail = detail
  }
}

export const diffKeys = {
  diff: (runId: string) => ['run', runId, 'diff'] as const,
  fileContent: (runId: string, path: string) => ['run', runId, 'file', path] as const,
}

/** Fetches and parses the run's unified diff; malformed diffs end in the error state. */
export function useRunDiff(runId: string) {
  const api = useReviewApi()
  return useQuery({
    queryKey: diffKeys.diff(runId),
    queryFn: async ({ signal }) => {
      const text = z.string().parse(await api.getDiff(runId, signal))
      const result = parseUnifiedDiff(text)
      if (!result.ok) throw new DiffParseFailure(result.error)
      return result.files
    },
  })
}

/** Head-side file content used for context expansion; null when the backend has none. */
export function useFileContent(runId: string, path: string | null) {
  const api = useReviewApi()
  return useQuery({
    queryKey: diffKeys.fileContent(runId, path ?? ''),
    queryFn: async ({ signal }) =>
      z
        .string()
        .nullable()
        .parse(await api.getFileContent({ runId, path: path ?? '' }, signal)),
    enabled: path !== null,
    staleTime: Infinity,
  })
}

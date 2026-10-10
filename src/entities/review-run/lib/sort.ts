import type { ReviewRun } from '../model/schema'

/** Newest first by creation time; returns a new array. */
export function sortRunsNewestFirst(runs: readonly ReviewRun[]): ReviewRun[] {
  return [...runs].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
}

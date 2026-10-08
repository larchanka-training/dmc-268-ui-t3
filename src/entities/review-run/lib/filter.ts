import type { ReviewRun } from '../model/schema'

/**
 * The runs of one repository, matched by full name (runs carry no repository ID yet).
 * Case-insensitive, because providers treat owner and repository names that way.
 */
export function runsOfRepository(runs: readonly ReviewRun[], fullName: string): ReviewRun[] {
  const wanted = fullName.toLowerCase()
  return runs.filter((run) => run.repository.toLowerCase() === wanted)
}

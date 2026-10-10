/** Sorts by full name, ignoring case and accents; returns a new array. */
export function sortByFullName<T extends { fullName: string }>(repositories: readonly T[]): T[] {
  return [...repositories].sort((a, b) =>
    a.fullName.localeCompare(b.fullName, 'en', { sensitivity: 'base' }),
  )
}

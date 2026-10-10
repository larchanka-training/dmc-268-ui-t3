/** Keeps repositories whose full name contains `query`, ignoring case and surrounding spaces. */
export function filterByFullName<T extends { fullName: string }>(
  repositories: readonly T[],
  query: string,
): T[] {
  const needle = query.trim().toLowerCase()
  if (needle === '') return [...repositories]
  return repositories.filter((item) => item.fullName.toLowerCase().includes(needle))
}

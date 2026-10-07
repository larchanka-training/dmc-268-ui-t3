import { z } from 'zod'

export const VCS_PROVIDERS = ['github', 'gitlab'] as const

const nonEmpty = z.string().trim().min(1)

/** Only absolute https URLs reach an `href`; `javascript:` and other schemes fail validation. */
const httpsUrl = z
  .string()
  .refine((value) => URL.canParse(value) && new URL(value).protocol === 'https:', {
    message: 'must be an absolute https URL',
  })

const repositoryFields = {
  provider: z.enum(VCS_PROVIDERS),
  external_id: nonEmpty,
  full_name: nonEmpty,
  url: httpsUrl,
  default_branch: nonEmpty,
  private: z.boolean(),
}

/** Validates a RepositoryWire payload (a connected repository) and maps it to the view model. */
export const repositorySchema = z
  .object({ ...repositoryFields, repository_id: nonEmpty, connected_at: z.iso.datetime() })
  .transform((wire) => ({
    id: wire.repository_id,
    provider: wire.provider,
    externalId: wire.external_id,
    fullName: wire.full_name,
    url: wire.url,
    defaultBranch: wire.default_branch,
    isPrivate: wire.private,
    connectedAt: wire.connected_at,
  }))

/** Validates an AvailableRepositoryWire payload (a repository the user can connect). */
export const availableRepositorySchema = z
  .object({ ...repositoryFields, repository_id: nonEmpty.nullable() })
  .transform((wire) => ({
    provider: wire.provider,
    externalId: wire.external_id,
    fullName: wire.full_name,
    url: wire.url,
    defaultBranch: wire.default_branch,
    isPrivate: wire.private,
    isConnected: wire.repository_id !== null,
  }))

export const repositoryListSchema = z.array(repositorySchema)
export const availableRepositoryListSchema = z.array(availableRepositorySchema)

export type Repository = z.output<typeof repositorySchema>
export type AvailableRepository = z.output<typeof availableRepositorySchema>
export type VcsProvider = Repository['provider']

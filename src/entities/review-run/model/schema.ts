import { z } from 'zod'

export const RUN_STATUSES = [
  'NEW',
  'QUEUED',
  'RUNNING',
  'COMPLETED',
  'FAILED',
  'CANCELLED',
] as const
export const COVERAGE_STATUSES = ['complete', 'partial', 'failed'] as const
export const PUBLICATION_STATUSES = ['not_published', 'pending', 'published', 'failed'] as const

const sha = z.string().regex(/^[0-9a-f]{40}$/)
const nonEmpty = z.string().trim().min(1)

/** Validates a ReviewRunWire payload and maps it to the view model. */
export const reviewRunSchema = z
  .object({
    run_id: nonEmpty,
    title: z.string(),
    repository: z.string(),
    pull_request: z.number().int().positive(),
    status: z.enum(RUN_STATUSES),
    coverage: z.object({
      status: z.enum(COVERAGE_STATUSES),
      limitations: z.array(nonEmpty),
    }),
    publication: z.object({ status: z.enum(PUBLICATION_STATUSES) }),
    base_sha: sha,
    head_sha: sha,
    rules_version: nonEmpty,
    created_at: z.iso.datetime(),
  })
  .transform((wire) => ({
    id: wire.run_id,
    title: wire.title,
    repository: wire.repository,
    pullRequest: wire.pull_request,
    status: wire.status,
    coverage: wire.coverage,
    publication: wire.publication,
    baseSha: wire.base_sha,
    headSha: wire.head_sha,
    rulesVersion: wire.rules_version,
    createdAt: wire.created_at,
  }))

export type ReviewRun = z.output<typeof reviewRunSchema>
export type RunStatus = ReviewRun['status']
export type CoverageStatus = ReviewRun['coverage']['status']
export type PublicationStatus = ReviewRun['publication']['status']

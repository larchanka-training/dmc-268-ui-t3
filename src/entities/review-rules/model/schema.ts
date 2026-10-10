import { z } from 'zod'
import { SEVERITIES } from '@/shared/lib/severity'
import { httpsUrl } from '@/shared/lib/https-url'

export const RULES_FILE_STATUSES = ['custom', 'missing', 'invalid'] as const

const nonEmpty = z.string().trim().min(1)
const sha = z.string().regex(/^[0-9a-f]{40}$/)

const ruleSchema = z
  .object({
    rule_id: nonEmpty,
    title: nonEmpty,
    description: z.string(),
    category: nonEmpty,
    severity: z.enum(SEVERITIES),
    enabled: z.boolean(),
  })
  .transform((wire) => ({
    id: wire.rule_id,
    title: wire.title,
    description: wire.description,
    category: wire.category,
    severity: wire.severity,
    enabled: wire.enabled,
  }))

const problemSchema = z.object({
  message: nonEmpty,
  line: z.number().int().positive().nullable(),
})

/**
 * Validates a RepositoryRulesWire payload and maps it to the view model. The status must agree
 * with the other fields, so an inconsistent payload never renders a misleading badge.
 */
export const repositoryRulesSchema = z
  .object({
    status: z.enum(RULES_FILE_STATUSES),
    path: nonEmpty,
    branch: nonEmpty,
    commit_sha: sha.nullable(),
    file_url: httpsUrl.nullable(),
    rules_version: nonEmpty,
    problems: z.array(problemSchema),
    rules: z.array(ruleSchema),
  })
  .superRefine((wire, context) => {
    const fileRead = wire.status !== 'missing'
    if (fileRead !== (wire.commit_sha !== null)) {
      context.addIssue({ code: 'custom', path: ['commit_sha'], message: 'disagrees with status' })
    }
    if (fileRead !== (wire.file_url !== null)) {
      context.addIssue({ code: 'custom', path: ['file_url'], message: 'disagrees with status' })
    }
    if ((wire.status === 'invalid') !== wire.problems.length > 0) {
      context.addIssue({ code: 'custom', path: ['problems'], message: 'disagrees with status' })
    }
  })
  .transform((wire) => ({
    status: wire.status,
    path: wire.path,
    branch: wire.branch,
    commitSha: wire.commit_sha,
    fileUrl: wire.file_url,
    rulesVersion: wire.rules_version,
    problems: wire.problems,
    rules: wire.rules,
  }))

export type RepositoryRules = z.output<typeof repositoryRulesSchema>
export type RulesFileStatus = RepositoryRules['status']
export type Rule = RepositoryRules['rules'][number]
export type RulesProblem = RepositoryRules['problems'][number]

import { z } from 'zod'

export const SEVERITY_THRESHOLDS = ['all', 'warning_and_critical', 'critical_only'] as const

const branchPattern = z.string().trim().min(1)

/** Validates a ReviewSettingsWire payload and maps it to the view model. */
export const reviewSettingsSchema = z
  .object({
    auto_review: z.boolean(),
    branch_filter: z.array(branchPattern),
    severity_threshold: z.enum(SEVERITY_THRESHOLDS),
    updated_at: z.iso.datetime(),
  })
  .transform((wire) => ({
    autoReview: wire.auto_review,
    branchFilter: wire.branch_filter,
    severityThreshold: wire.severity_threshold,
    updatedAt: wire.updated_at,
  }))

export type ReviewSettings = z.output<typeof reviewSettingsSchema>
export type SeverityThreshold = ReviewSettings['severityThreshold']
/** The editable part of the settings, as sent to the server. */
export type ReviewSettingsValues = Omit<ReviewSettings, 'updatedAt'>

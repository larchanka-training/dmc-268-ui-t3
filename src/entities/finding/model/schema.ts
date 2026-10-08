import { z } from 'zod'
import { SEVERITIES } from '@/shared/lib/severity'

export { SEVERITIES }
export const FINDING_STATUSES = ['open', 'resolved'] as const

const nonEmpty = z.string().trim().min(1)

export const lineAnchorSchema = z.object({
  path: nonEmpty,
  side: z.enum(['LEFT', 'RIGHT']),
  line: z.number().int().positive(),
})

export const replySchema = z
  .object({
    reply_id: nonEmpty,
    author: nonEmpty,
    body: nonEmpty,
    created_at: z.iso.datetime(),
  })
  .transform((wire) => ({
    id: wire.reply_id,
    author: wire.author,
    body: wire.body,
    createdAt: wire.created_at,
  }))

/** Head-side (RIGHT) line range of the anchor file and its replacement; may be empty (removal). */
export const suggestedChangeSchema = z
  .object({
    start_line: z.number().int().positive(),
    end_line: z.number().int().positive(),
    replacement: z.string(),
  })
  .refine((wire) => wire.end_line >= wire.start_line, {
    message: 'end_line must not be before start_line',
    path: ['end_line'],
  })
  .transform((wire) => ({
    startLine: wire.start_line,
    endLine: wire.end_line,
    replacement: wire.replacement,
  }))

/** Validates a FindingWire payload and maps it to the view model. */
export const findingSchema = z
  .object({
    finding_id: nonEmpty,
    rule_id: nonEmpty,
    title: nonEmpty,
    severity: z.enum(SEVERITIES),
    anchor: lineAnchorSchema,
    related_changed_lines: z.array(lineAnchorSchema).min(1),
    evidence: nonEmpty,
    impact: nonEmpty,
    recommendation: nonEmpty,
    confidence: z.number().min(0).max(1),
    status: z.enum(FINDING_STATUSES),
    replies: z.array(replySchema),
    suggested_change: suggestedChangeSchema.nullish(),
  })
  .refine((wire) => !(wire.suggested_change && wire.anchor.side === 'LEFT'), {
    message: 'a LEFT-anchored finding cannot carry a suggested change',
    path: ['suggested_change'],
  })
  .transform((wire) => ({
    id: wire.finding_id,
    ruleId: wire.rule_id,
    title: wire.title,
    severity: wire.severity,
    anchor: wire.anchor,
    relatedChangedLines: wire.related_changed_lines,
    evidence: wire.evidence,
    impact: wire.impact,
    recommendation: wire.recommendation,
    confidence: wire.confidence,
    status: wire.status,
    replies: wire.replies,
    suggestedChange: wire.suggested_change ?? null,
  }))

export const findingListSchema = z.array(findingSchema)

export type Finding = z.output<typeof findingSchema>
export type Reply = z.output<typeof replySchema>
export type Severity = Finding['severity']
export type FindingStatus = Finding['status']
export type SuggestedChangeData = z.output<typeof suggestedChangeSchema>

import { Badge } from '@/shared/ui/badge'
import type { CoverageStatus, PublicationStatus, RunStatus } from '../model/schema'

const RUN_LABEL: Record<RunStatus, string> = {
  NEW: 'New',
  QUEUED: 'Queued',
  RUNNING: 'Running',
  COMPLETED: 'Completed',
  FAILED: 'Failed',
  CANCELLED: 'Cancelled',
}

const COVERAGE_LABEL: Record<CoverageStatus, string> = {
  complete: 'Complete',
  partial: 'Partial',
  failed: 'Failed',
}

const PUBLICATION_LABEL: Record<PublicationStatus, string> = {
  not_published: 'Not published',
  pending: 'Publishing',
  published: 'Summary published',
  failed: 'Publishing failed',
}

export function RunStatusBadge({ status }: { status: RunStatus }) {
  return (
    <Badge variant={status === 'FAILED' ? 'destructive' : 'secondary'}>
      Run: {RUN_LABEL[status]}
    </Badge>
  )
}

export function CoverageBadge({ status }: { status: CoverageStatus }) {
  return (
    <Badge variant={status === 'complete' ? 'secondary' : 'destructive'}>
      Coverage: {COVERAGE_LABEL[status]}
    </Badge>
  )
}

export function PublicationBadge({ status }: { status: PublicationStatus }) {
  return (
    <Badge variant={status === 'failed' ? 'destructive' : 'outline'}>
      {PUBLICATION_LABEL[status]}
    </Badge>
  )
}

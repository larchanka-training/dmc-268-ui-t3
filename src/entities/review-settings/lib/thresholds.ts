import type { SeverityThreshold } from '../model/schema'

export interface ThresholdOption {
  label: string
  /** Which severity display groups the reviewer reports at this threshold. */
  description: string
}

export const THRESHOLD_OPTION: Record<SeverityThreshold, ThresholdOption> = {
  all: { label: 'All', description: 'Reports Critical, Warning and Info findings.' },
  warning_and_critical: {
    label: 'Warning and critical',
    description: 'Reports Critical and Warning findings.',
  },
  critical_only: { label: 'Only critical', description: 'Reports Critical findings only.' },
}

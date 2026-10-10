import { FileCheckIcon, FileWarningIcon, FileXIcon, type LucideIcon } from 'lucide-react'
import { Badge } from '@/shared/ui/badge'
import type { RulesFileStatus } from '../model/schema'

const STATUS: Record<
  RulesFileStatus,
  { label: string; icon: LucideIcon; variant: 'secondary' | 'outline' | 'destructive' }
> = {
  custom: { label: 'Custom rules', icon: FileCheckIcon, variant: 'secondary' },
  missing: { label: 'Default rules', icon: FileXIcon, variant: 'outline' },
  invalid: { label: 'Rules file invalid', icon: FileWarningIcon, variant: 'destructive' },
}

/** Whether `.review/rules.md` was found and parsed; the text carries the meaning. */
export function RulesStatusBadge({ status }: { status: RulesFileStatus }) {
  const { label, icon: Icon, variant } = STATUS[status]
  return (
    <Badge variant={variant} data-rules-status={status}>
      <Icon aria-hidden />
      {label}
    </Badge>
  )
}

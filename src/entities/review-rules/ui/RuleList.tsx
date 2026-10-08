import { severityGroup } from '@/shared/lib/severity'
import { Badge } from '@/shared/ui/badge'
import { SeverityGroupBadge } from '@/shared/ui/severity-group-badge'
import { ruleSeverityLabel } from '../lib/labels'
import type { Rule } from '../model/schema'

/** A read-only preview of rules, in the order given. All fields render as text, never as HTML. */
export function RuleList({ rules, label }: { rules: Rule[]; label: string }) {
  return (
    <ul aria-label={label} className="space-y-2">
      {rules.map((rule) => (
        <li key={rule.id} className="space-y-1.5 rounded-md border p-3">
          <div className="flex flex-wrap items-center gap-2">
            <code className="text-xs font-semibold">{rule.id}</code>
            <span className="font-medium">{rule.title}</span>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <SeverityGroupBadge group={severityGroup(rule.severity)}>
              <span className="sr-only">Severity: </span>
              {ruleSeverityLabel(rule.severity)}
            </SeverityGroupBadge>
            <Badge variant="outline">
              <span className="sr-only">Category: </span>
              {rule.category}
            </Badge>
            <Badge variant={rule.enabled ? 'secondary' : 'outline'}>
              {rule.enabled ? 'Enabled' : 'Disabled'}
            </Badge>
          </div>
          {rule.description && <p className="text-sm text-muted-foreground">{rule.description}</p>}
        </li>
      ))}
    </ul>
  )
}

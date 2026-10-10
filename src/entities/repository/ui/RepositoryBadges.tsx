import { GlobeIcon, LockIcon } from 'lucide-react'
import { Badge } from '@/shared/ui/badge'
import { PROVIDER_LABEL } from '../lib/labels'
import type { VcsProvider } from '../model/schema'

export function ProviderBadge({ provider }: { provider: VcsProvider }) {
  return <Badge variant="outline">{PROVIDER_LABEL[provider]}</Badge>
}

export function VisibilityBadge({ isPrivate }: { isPrivate: boolean }) {
  const Icon = isPrivate ? LockIcon : GlobeIcon
  return (
    <Badge variant="secondary">
      <Icon aria-hidden />
      {isPrivate ? 'Private' : 'Public'}
    </Badge>
  )
}

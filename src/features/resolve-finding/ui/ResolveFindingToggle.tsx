import { CircleCheck, RotateCcw } from 'lucide-react'
import type { Finding } from '@/entities/finding'
import { Button } from '@/shared/ui/button'
import { useSetFindingStatus } from '../model/use-set-finding-status'

interface ResolveFindingToggleProps {
  runId: string
  finding: Pick<Finding, 'id' | 'status'>
}

export function ResolveFindingToggle({ runId, finding }: ResolveFindingToggleProps) {
  const setStatus = useSetFindingStatus(runId)
  const resolved = finding.status === 'resolved'
  return (
    <span className="inline-flex items-center gap-2">
      {setStatus.isError && (
        <span role="alert" className="text-xs text-destructive">
          Status not saved
        </span>
      )}
      <Button
        variant="outline"
        size="xs"
        onClick={() => {
          setStatus.mutate({ findingId: finding.id, status: resolved ? 'open' : 'resolved' })
        }}
      >
        {resolved ? <RotateCcw /> : <CircleCheck />}
        {resolved ? 'Unresolve' : 'Resolve'}
      </Button>
    </span>
  )
}

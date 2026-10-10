import { useId } from 'react'
import type { AvailableRepository } from '@/entities/repository'
import { Button } from '@/shared/ui/button'
import { describeConnectError } from '../lib/describe-error'
import { useConnectRepository } from '../model/use-connect-repository'

interface ConnectRepositoryButtonProps {
  repository: AvailableRepository
  onConnected: () => void
}

/** "Connect" for one repository, with its own pending and error state. */
export function ConnectRepositoryButton({ repository, onConnected }: ConnectRepositoryButtonProps) {
  const connect = useConnectRepository(onConnected)
  const errorId = useId()

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        size="sm"
        disabled={connect.isPending}
        aria-describedby={connect.isError ? errorId : undefined}
        onClick={() => {
          if (!connect.isPending) connect.mutate(repository)
        }}
      >
        {connect.isPending ? 'Connecting…' : 'Connect'}{' '}
        <span className="sr-only">{repository.fullName}</span>
      </Button>
      {connect.isError && (
        <p id={errorId} role="alert" className="text-right text-sm text-destructive">
          {describeConnectError(connect.error)}
        </p>
      )}
    </div>
  )
}

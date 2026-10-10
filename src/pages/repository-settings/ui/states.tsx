import type { ReactNode } from 'react'
import { Button } from '@/shared/ui/button'

export function LoadingState({ children }: { children: ReactNode }) {
  return (
    <p role="status" aria-busy="true" className="text-sm text-muted-foreground">
      {children}
    </p>
  )
}

export function ErrorState({
  title,
  detail,
  onRetry,
}: {
  title: string
  detail: string
  onRetry: () => void
}) {
  return (
    <div role="alert" className="space-y-3 rounded-md border border-destructive/40 p-4">
      <p className="font-medium">{title}</p>
      <p className="text-sm text-muted-foreground">{detail}</p>
      <Button variant="outline" size="sm" onClick={onRetry}>
        Retry
      </Button>
    </div>
  )
}

/** A titled page section; its heading names the section landmark. */
export function Section({
  id,
  title,
  description,
  children,
}: {
  id: string
  title: string
  description?: string
  children: ReactNode
}) {
  return (
    <section aria-labelledby={id} className="space-y-4 rounded-xl border bg-card p-6 shadow-sm">
      <div className="space-y-1">
        <h2 id={id} className="font-semibold">
          {title}
        </h2>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
      {children}
    </section>
  )
}

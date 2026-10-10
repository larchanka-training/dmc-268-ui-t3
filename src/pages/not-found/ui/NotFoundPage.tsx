import { Link } from '@tanstack/react-router'
import { Button } from '@/shared/ui/button'

export function NotFoundPage() {
  return (
    <div className="space-y-3">
      <h1 className="text-lg font-semibold">Page not found</h1>
      <p className="text-sm text-muted-foreground">
        There is nothing at this address. It may have moved, or the link is mistyped.
      </p>
      <Button asChild variant="outline" size="sm">
        <Link to="/runs">Review runs</Link>
      </Button>
    </div>
  )
}

import { useSignOutReason } from '@/entities/session'
import { SignInButton } from '@/features/auth-by-github'
import { ThemeToggleGroup } from '@/features/switch-theme'
import type { ConfigResult } from '@/shared/config/env'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card'
import type { ReactNode } from 'react'

/** Signed-out screens sit outside the app shell, so they bring their own theme switcher. */
function SignedOutLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen">
      <div className="flex justify-end p-4">
        <ThemeToggleGroup />
      </div>
      <main className="px-4">{children}</main>
    </div>
  )
}

export function SignInPage({ config }: { config: ConfigResult }) {
  const reason = useSignOutReason()

  if (!config.ok) {
    return (
      <SignedOutLayout>
        <Card role="alert" className="mx-auto mt-12 max-w-md border-destructive/40">
          <CardHeader>
            <CardTitle>Sign-in is not configured</CardTitle>
            <CardDescription>
              Fix these build-time variables (see .env.example) and rebuild the app.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="list-disc space-y-1 pl-5 text-sm">
              {config.issues.map((issue) => (
                <li key={issue.variable}>
                  <code>{issue.variable}</code> {issue.message}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </SignedOutLayout>
    )
  }

  return (
    <SignedOutLayout>
      <Card className="mx-auto mt-12 max-w-md">
        <CardHeader>
          <CardTitle>AI code review</CardTitle>
          <CardDescription>Sign in with your GitHub account to open review runs.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {reason === 'expired' && (
            <p role="status" className="text-sm">
              Your session expired. Sign in again to continue.
            </p>
          )}
          {config.config.authMode === 'mock' && (
            <p className="text-xs text-muted-foreground">
              Mock mode: sign-in uses a demo account and does not contact GitHub.
            </p>
          )}
          <SignInButton config={config.config} />
        </CardContent>
      </Card>
    </SignedOutLayout>
  )
}

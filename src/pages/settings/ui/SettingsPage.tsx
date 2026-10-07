import { useSessionUser } from '@/entities/session'
import { ThemeToggleGroup } from '@/features/switch-theme'
import type { AuthMode } from '@/shared/config/env'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card'

export function SettingsPage({ authMode }: { authMode: AuthMode }) {
  const user = useSessionUser()

  return (
    <div className="max-w-2xl space-y-4">
      <h1 className="text-lg font-semibold">Settings</h1>

      <section aria-labelledby="settings-appearance">
        <Card>
          <CardHeader>
            <CardTitle id="settings-appearance" role="heading" aria-level={2}>
              Appearance
            </CardTitle>
            <CardDescription>
              Theme for this browser. System follows your operating system.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ThemeToggleGroup />
          </CardContent>
        </Card>
      </section>

      <section aria-labelledby="settings-account">
        <Card>
          <CardHeader>
            <CardTitle id="settings-account" role="heading" aria-level={2}>
              Account
            </CardTitle>
            <CardDescription>
              {authMode === 'mock'
                ? 'Mock authentication is in use: this is a demo account and GitHub is not contacted.'
                : 'Signed in with GitHub.'}
            </CardDescription>
          </CardHeader>
          {user && (
            <CardContent className="flex items-center gap-3">
              <img src={user.avatarUrl} alt="" className="size-10 rounded-full border" />
              <dl className="text-sm">
                <dt className="sr-only">GitHub login</dt>
                <dd className="font-medium">@{user.login}</dd>
                {user.name && (
                  <>
                    <dt className="sr-only">Name</dt>
                    <dd className="text-muted-foreground">{user.name}</dd>
                  </>
                )}
              </dl>
            </CardContent>
          )}
        </Card>
      </section>
    </div>
  )
}

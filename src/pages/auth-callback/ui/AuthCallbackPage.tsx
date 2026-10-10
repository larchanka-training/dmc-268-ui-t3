import { SignInButton, useCompleteSignIn, type SignInError } from '@/features/auth-by-github'
import type { AppConfig } from '@/shared/config/env'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card'

const ERROR_TEXT: Record<SignInError, { title: string; description: string }> = {
  cancelled: {
    title: 'Sign-in was cancelled',
    description: 'GitHub did not grant access. You can try again.',
  },
  'state-mismatch': {
    title: 'Sign-in could not be verified',
    description:
      'This sign-in link is not from the current browser tab or has already been used. Start a new sign-in.',
  },
  'exchange-failed': {
    title: 'Sign-in failed',
    description: 'The server could not complete the sign-in. Please try again.',
  },
}

interface AuthCallbackPageProps {
  config: AppConfig
  onSignedIn: (returnTo: string) => void
}

export function AuthCallbackPage({ config, onSignedIn }: AuthCallbackPageProps) {
  const state = useCompleteSignIn({ config, onSignedIn })

  if (state.status === 'pending') {
    return (
      <p role="status" className="mt-16 text-center text-sm text-muted-foreground">
        Signing you in…
      </p>
    )
  }

  const text = ERROR_TEXT[state.error]
  return (
    <Card role="alert" className="mx-auto mt-16 max-w-md">
      <CardHeader>
        <CardTitle>{text.title}</CardTitle>
        <CardDescription>{text.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <SignInButton config={config} label="Try again" />
      </CardContent>
    </Card>
  )
}

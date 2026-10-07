import { useState } from 'react'
import type { AppConfig } from '@/shared/config/env'
import { Button } from '@/shared/ui/button'
import { startGithubSignIn } from '../model/start-github-sign-in'

interface SignInButtonProps {
  config: AppConfig
  label?: string
}

export function SignInButton({ config, label = 'Sign in with GitHub' }: SignInButtonProps) {
  const [redirecting, setRedirecting] = useState(false)

  return (
    <Button
      disabled={redirecting}
      onClick={() => {
        setRedirecting(true)
        startGithubSignIn(config).catch(() => {
          setRedirecting(false)
        })
      }}
    >
      {redirecting ? 'Redirecting to GitHub…' : label}
    </Button>
  )
}

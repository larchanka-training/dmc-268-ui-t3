import { getRouteApi, Outlet, useNavigate, useRouter } from '@tanstack/react-router'
import { useEffect } from 'react'
import { AuthCallbackPage } from '@/pages/auth-callback'
import { ConnectRepositoryPage } from '@/pages/connect-repository'
import { RepositorySettingsPage } from '@/pages/repository-settings'
import { ReviewRunPage } from '@/pages/review-run'
import { SettingsPage } from '@/pages/settings'
import { SignInPage } from '@/pages/sign-in'
import { useRouteTitle } from '@/widgets/app-shell'
import { SessionGate } from './SessionGate'

// Route components for app/router.tsx. They adapt router context and params
// to page props, so pages stay unaware of the route tree.

const rootRouteApi = getRouteApi('__root__')
const runRouteApi = getRouteApi('/app/runs/$runId')
const repositorySettingsRouteApi = getRouteApi('/app/repositories/$repositoryId/settings')

const APP_NAME = 'AI code review'

export function RootLayout() {
  const title = useRouteTitle()
  useEffect(() => {
    document.title = title ? `${title} · ${APP_NAME}` : APP_NAME
  }, [title])
  return <Outlet />
}

export function CallbackRoute() {
  const { config } = rootRouteApi.useRouteContext()
  const router = useRouter()
  if (!config.ok) return <SignInPage config={config} />
  return (
    <AuthCallbackPage
      config={config.config}
      // The router owns navigation: replace the callback entry with the saved path.
      onSignedIn={(returnTo) => {
        router.history.replace(returnTo)
      }}
    />
  )
}

export function AppLayout() {
  const { config, createReviewApi } = rootRouteApi.useRouteContext()
  return <SessionGate config={config} createReviewApi={createReviewApi} />
}

export function RunRoute() {
  const { runId } = runRouteApi.useParams()
  return <ReviewRunPage runId={runId} />
}

export function ConnectRepositoryRoute() {
  const { config } = rootRouteApi.useRouteContext()
  const navigate = useNavigate()
  return (
    <ConnectRepositoryPage
      githubAppInstallUrl={config.ok ? config.config.githubAppInstallUrl : null}
      onConnected={() => void navigate({ to: '/repositories' })}
    />
  )
}

export function RepositorySettingsRoute() {
  const { repositoryId } = repositorySettingsRouteApi.useParams()
  return <RepositorySettingsPage repositoryId={repositoryId} />
}

export function SettingsRoute() {
  const { config } = rootRouteApi.useRouteContext()
  return <SettingsPage authMode={config.ok ? config.config.authMode : 'mock'} />
}

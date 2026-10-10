import type { QueryClient } from '@tanstack/react-query'
import {
  createRootRouteWithContext,
  createRoute,
  createRouter,
  redirect,
  type RouterHistory,
} from '@tanstack/react-router'
import { NotFoundPage } from '@/pages/not-found'
import { RepositoriesPage } from '@/pages/repositories'
import { ReviewRunsPage } from '@/pages/review-runs'
import { CALLBACK_PATH, type ConfigResult } from '@/shared/config/env'
import {
  AppLayout,
  CallbackRoute,
  ConnectRepositoryRoute,
  RootLayout,
  RunRoute,
  SettingsRoute,
} from './ui/routes'
import type { ReviewApiFactory } from './ui/SessionGate'

export interface RouterContext {
  config: ConfigResult
  createReviewApi: ReviewApiFactory
  queryClient: QueryClient
}

/*
 * Route tree (see FRONTEND_ARCHITECTURE.md, Routes):
 *   __root__                 document title
 *   ├── /auth/callback       public, no shell
 *   └── app (pathless)       session gate + shell
 *       ├── /                redirect: ?run=<id> → /runs/<id>, else /repositories
 *       ├── /repositories, /repositories/connect
 *       ├── /runs, /runs/$runId, /settings
 *       └── $                not found
 */

const rootRoute = createRootRouteWithContext<RouterContext>()({ component: RootLayout })

const callbackRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: CALLBACK_PATH,
  staticData: { title: 'Signing in' },
  component: CallbackRoute,
})

const appRoute = createRoute({ getParentRoute: () => rootRoute, id: 'app', component: AppLayout })

const indexRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/',
  validateSearch: (search: Record<string, unknown>): { run?: string } =>
    typeof search.run === 'string' || typeof search.run === 'number'
      ? { run: String(search.run) }
      : {},
  // Runs before the layout renders, so a signed-out user already sees sign-in at the new URL.
  beforeLoad: ({ search }) => {
    if (search.run) {
      throw redirect({ to: '/runs/$runId', params: { runId: search.run }, replace: true })
    }
    throw redirect({ to: '/repositories', replace: true })
  },
})

const repositoriesRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/repositories',
  staticData: { title: 'Repositories' },
  component: RepositoriesPage,
})

const connectRepositoryRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/repositories/connect',
  staticData: { title: 'Connect repository' },
  component: ConnectRepositoryRoute,
})

const runsRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/runs',
  staticData: { title: 'Review runs' },
  component: ReviewRunsPage,
})

const runRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/runs/$runId',
  staticData: { title: 'Review run' },
  component: RunRoute,
})

const settingsRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/settings',
  staticData: { title: 'Settings' },
  component: SettingsRoute,
})

/** Any other path: not-found inside the shell (and behind sign-in, like every page). */
const notFoundRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '$',
  staticData: { title: 'Page not found' },
  component: NotFoundPage,
})

const routeTree = rootRoute.addChildren([
  callbackRoute,
  appRoute.addChildren([
    indexRoute,
    repositoriesRoute,
    connectRepositoryRoute,
    runsRoute,
    runRoute,
    settingsRoute,
    notFoundRoute,
  ]),
])

export function createAppRouter({
  history,
  context,
}: {
  history?: RouterHistory
  context: RouterContext
}) {
  return createRouter({ routeTree, history, context, defaultNotFoundComponent: NotFoundPage })
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof createAppRouter>
  }
}

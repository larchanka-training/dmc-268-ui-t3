import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  RouterProvider,
} from '@tanstack/react-router'
import { act, render } from '@testing-library/react'
import type { ReactElement } from 'react'
import { createWrapper } from './render'

type ProviderOptions = NonNullable<Parameters<typeof createWrapper>[0]>

interface RouterRenderOptions extends ProviderOptions {
  /** Initial location, e.g. `/runs/run-1`. */
  path?: string
  /** Extra route patterns whose params the component reads, e.g. `/runs/$runId`. */
  routes?: string[]
}

/**
 * Renders a component that uses router hooks or `Link`, at `path`, inside the
 * app providers. Every path matches (a splat route), so links can point
 * anywhere; pass `routes` for params the component reads. The app's real
 * route tree is tested in `app/`.
 */
export async function renderWithRouter(ui: ReactElement, options: RouterRenderOptions = {}) {
  const { path = '/', routes = [], ...providerOptions } = options
  const rootRoute = createRootRoute({
    component: () => (
      <>
        {ui}
        <Outlet />
      </>
    ),
  })
  const children = [...routes, '$'].map((pattern) =>
    createRoute({ getParentRoute: () => rootRoute, path: pattern }),
  )
  const router = createRouter({
    routeTree: rootRoute.addChildren(children),
    history: createMemoryHistory({ initialEntries: [path] }),
  })
  await act(() => router.load())
  const Wrapper = createWrapper(providerOptions)
  const result = render(
    <Wrapper>
      <RouterProvider router={router} />
    </Wrapper>,
  )
  return { ...result, router }
}

import { useRouterState } from '@tanstack/react-router'

/** Title of the deepest matched route that declares one in `staticData`. */
export function useRouteTitle(): string | undefined {
  return useRouterState({
    select: (state) =>
      [...state.matches].reverse().find((match) => match.staticData.title)?.staticData.title,
  })
}

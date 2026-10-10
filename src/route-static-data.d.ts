import '@tanstack/react-router'

// Per-route static data, typed for every layer: the header and document title read `title`.
declare module '@tanstack/react-router' {
  interface StaticDataRouteOption {
    title?: string
  }
}

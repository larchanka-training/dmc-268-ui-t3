import type { ReactNode } from 'react'
import type { AuthMode } from '@/shared/config/env'
import { Header } from './Header'
import { Sidebar } from './Sidebar'

const skipLinkClassName =
  'sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-md focus:bg-background focus:px-3 focus:py-2 focus:text-sm focus:shadow focus:ring-[3px] focus:ring-ring/50'

interface AppShellProps {
  authMode: AuthMode
  children: ReactNode
}

/** The signed-in frame: skip link, sidebar navigation, header, and the main region. */
export function AppShell({ authMode, children }: AppShellProps) {
  return (
    <div className="flex min-h-screen">
      <a
        href="#main"
        className={skipLinkClassName}
        onClick={(event) => {
          // Move focus without a hash navigation, which the router would treat as a route change.
          event.preventDefault()
          document.getElementById('main')?.focus()
        }}
      >
        Skip to content
      </a>
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header authMode={authMode} />
        <main id="main" tabIndex={-1} className="mx-auto w-full max-w-6xl flex-1 p-4 outline-none">
          {children}
        </main>
      </div>
    </div>
  )
}

/** Shell-shaped placeholder while the session is restored on page load. */
export function ShellSkeleton() {
  return (
    <div className="flex min-h-screen" aria-busy="true">
      <div className="hidden w-60 shrink-0 border-r bg-card p-3 md:block">
        <div className="space-y-2">
          {[0, 1, 2].map((item) => (
            <div key={item} className="h-7 animate-pulse rounded-md bg-muted" />
          ))}
        </div>
      </div>
      <div className="flex flex-1 flex-col">
        <div className="flex h-14 items-center justify-end gap-2 border-b px-4">
          <div className="size-8 animate-pulse rounded-full bg-muted" />
        </div>
        <div className="space-y-3 p-4">
          <p role="status" className="text-sm text-muted-foreground">
            Restoring your session…
          </p>
          <div className="h-24 animate-pulse rounded-md bg-muted" />
        </div>
      </div>
    </div>
  )
}

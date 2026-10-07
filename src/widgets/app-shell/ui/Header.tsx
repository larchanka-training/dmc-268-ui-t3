import { MenuIcon } from 'lucide-react'
import { useState } from 'react'
import { UserMenu } from '@/features/auth-by-github'
import { ThemeMenu } from '@/features/switch-theme'
import type { AuthMode } from '@/shared/config/env'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from '@/shared/ui/sheet'
import { useRouteTitle } from '../lib/use-route-title'
import { NavList } from './NavList'

function MobileNav() {
  const [open, setOpen] = useState(false)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden" aria-label="Open navigation">
          <MenuIcon aria-hidden />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="p-4">
        <SheetTitle>AI code review</SheetTitle>
        <SheetDescription className="sr-only">Main navigation</SheetDescription>
        {/* Choosing a destination closes the drawer; Radix returns focus to the trigger. */}
        <div
          onClick={(event) => {
            if (event.target instanceof Element && event.target.closest('a')) setOpen(false)
          }}
        >
          <NavList />
        </div>
      </SheetContent>
    </Sheet>
  )
}

export function Header({ authMode }: { authMode: AuthMode }) {
  const title = useRouteTitle()

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center gap-2 border-b bg-background/95 px-4 backdrop-blur">
      <MobileNav />
      <span className="truncate font-medium">{title}</span>
      <div className="ml-auto flex items-center gap-2">
        {authMode === 'mock' && (
          <Badge variant="outline" title="Sign-in uses a demo account; GitHub is not contacted">
            Mock auth
          </Badge>
        )}
        <ThemeMenu />
        <UserMenu />
      </div>
    </header>
  )
}

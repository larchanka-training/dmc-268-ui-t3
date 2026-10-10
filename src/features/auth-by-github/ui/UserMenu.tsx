import { Link } from '@tanstack/react-router'
import { LogOutIcon, SettingsIcon } from 'lucide-react'
import { useState } from 'react'
import { getAccessToken, useSessionActions, useSessionUser } from '@/entities/session'
import { useAuthApi } from '@/shared/api'
import { Button } from '@/shared/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu'

interface UserMenuProps {
  onSignedOut?: () => void
}

/** Header auth status: the signed-in GitHub identity, with a menu for settings and sign-out. */
export function UserMenu({ onSignedOut }: UserMenuProps) {
  const user = useSessionUser()
  const authApi = useAuthApi()
  const { signOut } = useSessionActions()
  const [signingOut, setSigningOut] = useState(false)

  if (!user) return null

  const handleSignOut = () => {
    setSigningOut(true)
    // The backend revokes the refresh cookie; the local session ends either way.
    authApi
      .logout(getAccessToken())
      .catch(() => undefined)
      .finally(() => {
        signOut()
        onSignedOut?.()
      })
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="gap-2 px-2"
          aria-label={`Account: ${user.login}`}
          disabled={signingOut}
        >
          <img src={user.avatarUrl} alt="" className="size-7 rounded-full border" />
          <span className="hidden text-sm font-medium sm:inline">{user.login}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="space-y-0.5">
          {user.name && <span className="block truncate">{user.name}</span>}
          <span className="block truncate text-xs font-normal text-muted-foreground">
            @{user.login}
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to="/settings">
            <SettingsIcon aria-hidden />
            Settings
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={handleSignOut}>
          <LogOutIcon aria-hidden />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

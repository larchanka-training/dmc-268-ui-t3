import { THEME_PREFERENCES, useSetThemePreference, useThemePreference } from '@/shared/lib/theme'
import { Button } from '@/shared/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu'
import { THEME_OPTIONS, themeOption } from '../lib/options'

/** Header theme switcher: an icon button showing the current preference, with a radio menu. */
export function ThemeMenu() {
  const preference = useThemePreference()
  const setPreference = useSetThemePreference()
  const current = themeOption(preference)
  const Icon = current.icon

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={`Theme: ${current.label}`}>
          <Icon aria-hidden />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Theme</DropdownMenuLabel>
        <DropdownMenuRadioGroup
          value={preference}
          onValueChange={(value) => {
            const next = THEME_PREFERENCES.find((option) => option === value)
            if (next) setPreference(next)
          }}
        >
          {THEME_OPTIONS.map(({ value, label, icon: OptionIcon }) => (
            <DropdownMenuRadioItem key={value} value={value}>
              <OptionIcon aria-hidden />
              {label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

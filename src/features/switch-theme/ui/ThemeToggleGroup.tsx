import { THEME_PREFERENCES, useSetThemePreference, useThemePreference } from '@/shared/lib/theme'
import { ToggleGroup, ToggleGroupItem } from '@/shared/ui/toggle-group'
import { THEME_OPTIONS } from '../lib/options'

/** Segmented Light / Dark / System control, for Settings and the sign-in screen. */
export function ThemeToggleGroup() {
  const preference = useThemePreference()
  const setPreference = useSetThemePreference()

  return (
    <ToggleGroup
      type="single"
      variant="outline"
      size="sm"
      aria-label="Theme"
      value={preference}
      onValueChange={(value) => {
        // Radix sends '' when the active item is pressed again; keep the current choice.
        const next = THEME_PREFERENCES.find((option) => option === value)
        if (next) setPreference(next)
      }}
    >
      {THEME_OPTIONS.map(({ value, label, icon: Icon }) => (
        <ToggleGroupItem key={value} value={value} aria-label={label}>
          <Icon aria-hidden />
          {label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  )
}

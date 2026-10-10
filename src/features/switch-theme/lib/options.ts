import { MonitorIcon, MoonIcon, SunIcon, type LucideIcon } from 'lucide-react'
import type { ThemePreference } from '@/shared/lib/theme'

export const THEME_OPTIONS: { value: ThemePreference; label: string; icon: LucideIcon }[] = [
  { value: 'light', label: 'Light', icon: SunIcon },
  { value: 'dark', label: 'Dark', icon: MoonIcon },
  { value: 'system', label: 'System', icon: MonitorIcon },
]

export function themeOption(preference: ThemePreference) {
  return THEME_OPTIONS.find((option) => option.value === preference) ?? THEME_OPTIONS[2]
}

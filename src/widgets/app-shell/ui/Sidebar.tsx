import { PanelLeftCloseIcon, PanelLeftOpenIcon } from 'lucide-react'
import { cn } from '@/shared/lib/cn'
import { Button } from '@/shared/ui/button'
import { useSidebarCollapsed, useToggleSidebar } from '../model/sidebar-store'
import { NavList } from './NavList'

/** Desktop sidebar (md and up); narrow screens use the header drawer instead. */
export function Sidebar() {
  const collapsed = useSidebarCollapsed()
  const toggle = useToggleSidebar()

  return (
    <aside
      className={cn(
        'sticky top-0 hidden h-screen shrink-0 flex-col gap-4 border-r bg-card p-3 md:flex',
        collapsed ? 'w-14' : 'w-60',
      )}
    >
      <span className={cn('px-2 font-semibold', collapsed && 'sr-only')}>AI code review</span>
      <div className="flex-1">
        <NavList collapsed={collapsed} />
      </div>
      <Button
        variant="ghost"
        size="icon-sm"
        className={cn(!collapsed && 'self-end')}
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        aria-expanded={!collapsed}
        onClick={toggle}
      >
        {collapsed ? <PanelLeftOpenIcon aria-hidden /> : <PanelLeftCloseIcon aria-hidden />}
      </Button>
    </aside>
  )
}

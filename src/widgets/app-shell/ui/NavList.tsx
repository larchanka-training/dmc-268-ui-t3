import { Link, useMatchRoute } from '@tanstack/react-router'
import {
  FolderGit2Icon,
  GitPullRequestIcon,
  ListChecksIcon,
  SettingsIcon,
  type LucideIcon,
} from 'lucide-react'
import type { ReactElement } from 'react'
import { useReviewRun } from '@/entities/review-run'
import { cn } from '@/shared/lib/cn'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/shared/ui/tooltip'

interface ItemStyle {
  collapsed: boolean
  /** Highlighted as the current section even when not the exact page. */
  sectionActive?: boolean
  nested?: boolean
}

function itemClassName({ collapsed, sectionActive, nested }: ItemStyle) {
  return cn(
    'flex items-center gap-3 rounded-md px-2 py-1.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none',
    'aria-[current=page]:bg-accent aria-[current=page]:font-medium aria-[current=page]:text-accent-foreground',
    sectionActive && 'font-medium text-foreground',
    nested && !collapsed && 'ml-6',
    collapsed && 'justify-center',
  )
}

function ItemContent({
  icon: Icon,
  label,
  collapsed,
}: {
  icon: LucideIcon
  label: string
  collapsed: boolean
}) {
  return (
    <>
      <Icon aria-hidden className="size-4 shrink-0" />
      {!collapsed && <span className="truncate">{label}</span>}
    </>
  )
}

/** In rail mode the label moves to aria-label (on the link) and a tooltip. */
function RailTooltip({
  label,
  collapsed,
  children,
}: {
  label: string
  collapsed: boolean
  children: ReactElement
}) {
  if (!collapsed) return children
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent side="right">{label}</TooltipContent>
    </Tooltip>
  )
}

// Links use activeOptions.exact so aria-current="page" marks only the exact page;
// the section highlight for Repositories and Review runs is visual only.

function OpenRunItem({ runId, collapsed }: { runId: string; collapsed: boolean }) {
  const run = useReviewRun(runId)
  const label = run.data?.title ?? runId
  return (
    <RailTooltip label={label} collapsed={collapsed}>
      <Link
        to="/runs/$runId"
        params={{ runId }}
        activeOptions={{ exact: true }}
        aria-label={collapsed ? label : undefined}
        className={itemClassName({ collapsed, nested: true })}
      >
        <ItemContent icon={GitPullRequestIcon} label={label} collapsed={collapsed} />
      </Link>
    </RailTooltip>
  )
}

/** The primary navigation list, shared by the desktop sidebar and the mobile drawer. */
export function NavList({ collapsed = false }: { collapsed?: boolean }) {
  const matchRoute = useMatchRoute()
  // Fuzzy: also the connect screen and repository settings pages.
  const inRepositories = Boolean(matchRoute({ to: '/repositories', fuzzy: true }))
  const inRuns = Boolean(matchRoute({ to: '/runs', fuzzy: true }))
  const openRun = matchRoute({ to: '/runs/$runId' })
  const runId = openRun ? openRun.runId : undefined

  return (
    <nav aria-label="Main">
      <ul className="space-y-1">
        <li>
          <RailTooltip label="Repositories" collapsed={collapsed}>
            <Link
              to="/repositories"
              activeOptions={{ exact: true }}
              aria-label={collapsed ? 'Repositories' : undefined}
              className={itemClassName({ collapsed, sectionActive: inRepositories })}
            >
              <ItemContent icon={FolderGit2Icon} label="Repositories" collapsed={collapsed} />
            </Link>
          </RailTooltip>
        </li>
        <li>
          <RailTooltip label="Review runs" collapsed={collapsed}>
            <Link
              to="/runs"
              activeOptions={{ exact: true }}
              aria-label={collapsed ? 'Review runs' : undefined}
              className={itemClassName({ collapsed, sectionActive: inRuns })}
            >
              <ItemContent icon={ListChecksIcon} label="Review runs" collapsed={collapsed} />
            </Link>
          </RailTooltip>
          {runId && (
            <ul className="mt-1">
              <li>
                <OpenRunItem runId={runId} collapsed={collapsed} />
              </li>
            </ul>
          )}
        </li>
        <li>
          <RailTooltip label="Settings" collapsed={collapsed}>
            <Link
              to="/settings"
              activeOptions={{ exact: true }}
              aria-label={collapsed ? 'Settings' : undefined}
              className={itemClassName({ collapsed })}
            >
              <ItemContent icon={SettingsIcon} label="Settings" collapsed={collapsed} />
            </Link>
          </RailTooltip>
        </li>
      </ul>
    </nav>
  )
}

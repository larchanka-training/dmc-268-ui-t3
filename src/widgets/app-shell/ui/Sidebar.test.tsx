import { act, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { mockAppState, RUN_ID } from '@/shared/api/mock/app-state.mock'
import { renderWithRouter } from '@/shared/lib/test/render-with-router'
import { sidebarStore } from '../model/sidebar-store'
import { Sidebar } from './Sidebar'

function currentLinks() {
  const nav = screen.getByRole('navigation', { name: 'Main' })
  return within(nav)
    .getAllByRole('link')
    .filter((link) => link.getAttribute('aria-current') === 'page')
}

describe('Sidebar', () => {
  beforeEach(() => {
    localStorage.clear()
    if (sidebarStore.getState().collapsed) sidebarStore.getState().toggleCollapsed()
  })

  it('lists Repositories, Review runs and Settings in that order', async () => {
    await renderWithRouter(<Sidebar />, { path: '/settings' })
    const nav = screen.getByRole('navigation', { name: 'Main' })
    expect(
      within(nav)
        .getAllByRole('link')
        .map((link) => link.textContent),
    ).toEqual(['Repositories', 'Review runs', 'Settings'])
    expect(within(nav).getByRole('link', { name: 'Repositories' })).toHaveAttribute(
      'href',
      '/repositories',
    )
  })

  it('marks Repositories as current on /repositories', async () => {
    await renderWithRouter(<Sidebar />, { path: '/repositories' })
    expect(currentLinks().map((link) => link.textContent)).toEqual(['Repositories'])
  })

  it('highlights the Repositories section on the connect screen without a current page', async () => {
    await renderWithRouter(<Sidebar />, { path: '/repositories/connect' })
    expect(currentLinks()).toEqual([])
    expect(screen.getByRole('link', { name: 'Repositories' })).toHaveClass('font-medium')
    expect(screen.getByRole('link', { name: 'Review runs' })).not.toHaveClass('font-medium')
  })

  it('marks only Settings as current on /settings', async () => {
    await renderWithRouter(<Sidebar />, { path: '/settings' })
    expect(currentLinks().map((link) => link.textContent)).toEqual(['Settings'])
  })

  it('marks Review runs as current on /runs', async () => {
    await renderWithRouter(<Sidebar />, { path: '/runs' })
    expect(currentLinks().map((link) => link.textContent)).toEqual(['Review runs'])
  })

  it('nests the open run under Review runs, labelled with its title', async () => {
    await renderWithRouter(<Sidebar />, { path: `/runs/${RUN_ID}`, routes: ['/runs/$runId'] })
    const nested = await screen.findByRole('link', { name: mockAppState.server.run.title })
    expect(nested).toHaveAttribute('href', `/runs/${RUN_ID}`)
    expect(nested).toHaveAttribute('aria-current', 'page')
    // The section stays highlighted, but only the run is the current page.
    expect(screen.getByRole('link', { name: 'Review runs' })).not.toHaveAttribute('aria-current')
    expect(screen.getByRole('link', { name: 'Review runs' })).toHaveClass('font-medium')
  })

  it('collapses to an icon rail with accessible names and tooltips', async () => {
    await renderWithRouter(<Sidebar />, { path: '/runs' })
    await userEvent.click(screen.getByRole('button', { name: 'Collapse sidebar' }))
    const repositories = screen.getByRole('link', { name: 'Repositories' })
    expect(repositories).not.toHaveTextContent('Repositories')
    expect(screen.getByRole('link', { name: 'Review runs' })).not.toHaveTextContent('Review runs')
    // Radix opens tooltips on keyboard focus (jsdom has no real hover). The links
    // come first in tab order, so tab in from the top of the page.
    act(() => {
      ;(document.activeElement as HTMLElement | null)?.blur()
    })
    await userEvent.tab()
    expect(repositories).toHaveFocus()
    await waitFor(() => {
      expect(screen.getByRole('tooltip')).toHaveTextContent('Repositories')
    })
    expect(screen.getByRole('button', { name: 'Expand sidebar' })).toHaveAttribute(
      'aria-expanded',
      'false',
    )
  })
})

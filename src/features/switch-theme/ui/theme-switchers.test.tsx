import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { themeStore } from '@/shared/lib/theme'
import { renderWithProviders } from '@/shared/lib/test/render'
import { ThemeMenu } from './ThemeMenu'
import { ThemeToggleGroup } from './ThemeToggleGroup'

const root = document.documentElement

describe('theme switchers', () => {
  beforeEach(() => {
    localStorage.clear()
    themeStore.getState().init()
  })

  it('selects Dark from the header menu', async () => {
    renderWithProviders(<ThemeMenu />)
    await userEvent.click(screen.getByRole('button', { name: 'Theme: System' }))
    expect(screen.getByRole('menuitemradio', { name: 'System' })).toHaveAttribute(
      'aria-checked',
      'true',
    )
    await userEvent.click(screen.getByRole('menuitemradio', { name: 'Dark' }))
    expect(root).toHaveAttribute('data-theme', 'dark')
    expect(screen.getByRole('button', { name: 'Theme: Dark' })).toBeInTheDocument()
  })

  it('works with the keyboard', async () => {
    renderWithProviders(<ThemeMenu />)
    screen.getByRole('button', { name: 'Theme: System' }).focus()
    await userEvent.keyboard('{Enter}')
    // Focus starts on the first item (Light); move to Dark and choose it.
    await userEvent.keyboard('{ArrowDown}{Enter}')
    expect(root).toHaveAttribute('data-theme', 'dark')
  })

  it('marks the current preference in the segmented control', async () => {
    renderWithProviders(<ThemeToggleGroup />)
    expect(screen.getByRole('radio', { name: 'System' })).toHaveAttribute('aria-checked', 'true')
    await userEvent.click(screen.getByRole('radio', { name: 'Light' }))
    expect(root).toHaveAttribute('data-theme', 'light')
    // Pressing the active item again does not clear the preference.
    await userEvent.click(screen.getByRole('radio', { name: 'Light' }))
    expect(themeStore.getState().preference).toBe('light')
  })

  it('keeps both switchers in sync', async () => {
    renderWithProviders(
      <>
        <ThemeToggleGroup />
        <ThemeMenu />
      </>,
    )
    await userEvent.click(screen.getByRole('radio', { name: 'Dark' }))
    expect(screen.getByRole('button', { name: 'Theme: Dark' })).toBeInTheDocument()
  })
})

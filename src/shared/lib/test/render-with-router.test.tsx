import { Link, useLocation } from '@tanstack/react-router'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { renderWithRouter } from './render-with-router'

function Probe() {
  const location = useLocation()
  return (
    <>
      <Link to="/settings">Settings</Link>
      <output>{location.pathname}</output>
    </>
  )
}

describe('renderWithRouter', () => {
  it('renders at the given path and follows links', async () => {
    await renderWithRouter(<Probe />, { path: '/runs/run-1' })
    expect(screen.getByRole('status')).toHaveTextContent('/runs/run-1')
    const link = screen.getByRole('link', { name: 'Settings' })
    expect(link).toHaveAttribute('href', '/settings')
    await userEvent.click(link)
    expect(await screen.findByText('/settings')).toBeInTheDocument()
  })
})

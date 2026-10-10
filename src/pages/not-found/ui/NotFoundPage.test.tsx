import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { renderWithRouter } from '@/shared/lib/test/render-with-router'
import { NotFoundPage } from './NotFoundPage'

describe('NotFoundPage', () => {
  it('links back to the run list', async () => {
    await renderWithRouter(<NotFoundPage />, { path: '/nope' })
    expect(screen.getByRole('heading', { name: 'Page not found' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Review runs' })).toHaveAttribute('href', '/runs')
  })
})

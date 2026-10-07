import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { FindingCard, useFindings } from '@/entities/finding'
import { RUN_ID } from '@/shared/api/mock/app-state.mock'
import { createMockReviewApi } from '@/shared/api/mock/mock-review-api'
import { renderWithProviders } from '@/shared/lib/test/render'
import { ResolveFindingToggle } from './ResolveFindingToggle'

function Harness({ findingId }: { findingId: string }) {
  const { data } = useFindings(RUN_ID)
  const finding = data?.find((item) => item.id === findingId)
  if (!finding) return null
  return (
    <FindingCard
      finding={finding}
      actions={<ResolveFindingToggle runId={RUN_ID} finding={finding} />}
    />
  )
}

const card = () => screen.getByRole('article')

describe('ResolveFindingToggle', () => {
  it('resolves an open finding and collapses it with a marker', async () => {
    renderWithProviders(<Harness findingId="f-sql-injection" />)
    await userEvent.click(await screen.findByRole('button', { name: 'Resolve' }))
    await waitFor(() => {
      expect(card()).toHaveAttribute('data-status', 'resolved')
    })
    expect(within(card()).getByText('Resolved')).toBeVisible()
    expect(within(card()).getByText('Evidence')).not.toBeVisible()
    expect(screen.getByRole('button', { name: 'Unresolve' })).toBeVisible()
  })

  it('keeps the finding content when resolved', async () => {
    renderWithProviders(<Harness findingId="f-sql-injection" />)
    const before = (await screen.findByRole('article')).textContent
    await userEvent.click(screen.getByRole('button', { name: 'Resolve' }))
    await userEvent.click(await screen.findByRole('button', { name: 'Show finding details' }))
    const after = card().textContent
    for (const text of [
      'Critical',
      'SEC-SQL-001',
      'User input is interpolated into a SQL query',
      'template literal',
    ]) {
      expect(before).toContain(text)
      expect(after).toContain(text)
    }
  })

  it('unresolves a resolved finding', async () => {
    renderWithProviders(<Harness findingId="f-wildcard-hosts" />)
    await userEvent.click(await screen.findByRole('button', { name: 'Unresolve' }))
    await waitFor(() => {
      expect(card()).toHaveAttribute('data-status', 'open')
    })
    expect(within(card()).getByText('Evidence')).toBeVisible()
  })

  it('rolls back and shows an error when the change fails', async () => {
    renderWithProviders(<Harness findingId="f-sql-injection" />, {
      api: createMockReviewApi({ failures: ['setFindingStatus'], delayMs: 20 }),
    })
    await userEvent.click(await screen.findByRole('button', { name: 'Resolve' }))
    expect(card()).toHaveAttribute('data-status', 'resolved') // optimistic
    expect(await screen.findByRole('alert')).toHaveTextContent('Status not saved')
    expect(card()).toHaveAttribute('data-status', 'open')
    expect(screen.getByRole('button', { name: 'Resolve' })).toBeVisible()
  })
})

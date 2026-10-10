import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { FindingCard, useFindings } from '@/entities/finding'
import { RUN_ID } from '@/shared/api/mock/app-state.mock'
import { createMockReviewApi } from '@/shared/api/mock/mock-review-api'
import { renderWithProviders } from '@/shared/lib/test/render'
import { ReplyForm } from './ReplyForm'

const FINDING_ID = 'f-wildcard-hosts' // resolved, with two replies

function Harness() {
  const { data } = useFindings(RUN_ID)
  const finding = data?.find((item) => item.id === FINDING_ID)
  if (!finding) return null
  return (
    <FindingCard
      finding={{ ...finding, status: 'open' }}
      footer={<ReplyForm runId={RUN_ID} findingId={FINDING_ID} />}
    />
  )
}

const replies = () =>
  within(screen.getByRole('list', { name: 'Replies' }))
    .getAllByRole('listitem')
    .map((item) => item.querySelector('p:last-child')?.textContent)

describe('ReplyForm', () => {
  it('adds the reply to the end of the thread and clears the input', async () => {
    renderWithProviders(<Harness />, { api: createMockReviewApi({ author: 'me' }) })
    const input = await screen.findByRole('textbox', { name: 'Reply' })
    await userEvent.type(input, 'False positive, the value is checked upstream')
    await userEvent.click(screen.getByRole('button', { name: 'Reply' }))
    expect(await screen.findByText('False positive, the value is checked upstream')).toBeVisible()
    expect(replies().at(-1)).toBe('False positive, the value is checked upstream')
    expect(input).toHaveValue('')
  })

  it('does not submit a blank reply', async () => {
    const api = createMockReviewApi()
    const replyToFinding = vi.spyOn(api, 'replyToFinding')
    renderWithProviders(<Harness />, { api })
    await userEvent.type(await screen.findByRole('textbox', { name: 'Reply' }), '   ')
    expect(screen.getByRole('button', { name: 'Reply' })).toBeDisabled()
    await userEvent.keyboard('{Enter}')
    expect(replyToFinding).not.toHaveBeenCalled()
  })

  it('keeps the text and shows an error when the reply fails', async () => {
    renderWithProviders(<Harness />, { api: createMockReviewApi({ failures: ['replyToFinding'] }) })
    const input = await screen.findByRole('textbox', { name: 'Reply' })
    await userEvent.type(input, 'Please double-check')
    await userEvent.click(screen.getByRole('button', { name: 'Reply' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('could not be sent')
    expect(input).toHaveValue('Please double-check')
    expect(replies()).toHaveLength(2)
    expect(screen.queryByText('Please double-check', { selector: 'li p' })).toBeNull()
  })

  it('says that replies are not posted to the pull request', async () => {
    renderWithProviders(<Harness />)
    expect(await screen.findByRole('textbox', { name: 'Reply' })).toHaveAccessibleDescription(
      'Replies stay in this review app and are not posted to the pull request.',
    )
  })
})

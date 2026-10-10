import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import {
  reviewSettingsKeys,
  reviewSettingsSchema,
  useReviewSettings,
} from '@/entities/review-settings'
import { ApiError, type ReviewApi } from '@/shared/api'
import { createMockReviewApi } from '@/shared/api/mock/mock-review-api'
import { mockRepositoryState } from '@/shared/api/mock/repositories.mock'
import { createTestQueryClient, renderWithProviders } from '@/shared/lib/test/render'
import { ReviewSettingsForm } from './ReviewSettingsForm'

// repo-1: automatic review on, `main` + `release/*`, "Warning and critical".
const settings = reviewSettingsSchema.parse(mockRepositoryState.settings['repo-1'])

/** Like the page: the form gets its settings from the query cache that a save updates. */
function CachedForm() {
  const query = useReviewSettings('repo-1')
  return query.data ? <ReviewSettingsForm repositoryId="repo-1" settings={query.data} /> : null
}

function renderForm(api: ReviewApi = createMockReviewApi()) {
  const queryClient = createTestQueryClient()
  queryClient.setQueryData(reviewSettingsKeys.detail('repo-1'), settings)
  renderWithProviders(<CachedForm />, { api, queryClient })
  return { queryClient }
}

const controls = {
  auto: () => screen.getByRole('switch', { name: 'Automatic review' }),
  branches: () => screen.getByRole('textbox', { name: 'Branch filter' }),
  threshold: (name: string) => screen.getByRole('radio', { name }),
  save: () => screen.getByRole('button', { name: /^(Save|Saving…)$/ }),
}

describe('ReviewSettingsForm', () => {
  it('shows the current values', () => {
    renderForm()
    expect(controls.auto()).toHaveAttribute('aria-checked', 'true')
    expect(controls.branches()).toHaveValue('main\nrelease/*')
    expect(controls.threshold('Warning and critical')).toHaveAttribute('aria-checked', 'true')
    expect(screen.getByRole('radiogroup', { name: 'Severity threshold' })).toBeInTheDocument()
    expect(controls.threshold('All')).toHaveAccessibleDescription(
      'Reports Critical, Warning and Info findings.',
    )
    expect(controls.threshold('Only critical')).toHaveAccessibleDescription(
      'Reports Critical findings only.',
    )
    expect(controls.save()).toBeDisabled()
  })

  it('says every branch is reviewed when the filter is empty', async () => {
    renderForm()
    await userEvent.clear(controls.branches())
    expect(screen.getByText(/Empty: every target branch is reviewed\./)).toBeInTheDocument()
  })

  it('disables Save again when a change is reverted', async () => {
    renderForm()
    await userEvent.click(controls.threshold('Only critical'))
    expect(controls.save()).toBeEnabled()
    await userEvent.click(controls.threshold('Warning and critical'))
    expect(controls.save()).toBeDisabled()
  })

  it('saves the changes once and announces it', async () => {
    const api = createMockReviewApi()
    const update = vi.spyOn(api, 'updateReviewSettings')
    const { queryClient } = renderForm(api)
    await userEvent.click(controls.auto())
    await userEvent.type(controls.branches(), '\n\n  develop  ')
    await userEvent.click(controls.save())

    expect(await screen.findByRole('status')).toHaveTextContent('Settings saved')
    expect(update).toHaveBeenCalledTimes(1)
    expect(update.mock.calls[0]?.[0]).toEqual({
      repositoryId: 'repo-1',
      settings: {
        auto_review: false,
        branch_filter: ['main', 'release/*', 'develop'],
        severity_threshold: 'warning_and_critical',
      },
    })
    expect(controls.save()).toBeDisabled()
    expect(controls.branches()).toHaveValue('main\nrelease/*\ndevelop')
    expect(queryClient.getQueryData(reviewSettingsKeys.detail('repo-1'))).toMatchObject({
      autoReview: false,
      branchFilter: ['main', 'release/*', 'develop'],
    })
  })

  it('sends one request for a double click and disables the controls while saving', async () => {
    const api = createMockReviewApi({ delayMs: 50 })
    const update = vi.spyOn(api, 'updateReviewSettings')
    renderForm(api)
    await userEvent.click(controls.threshold('All'))
    await userEvent.dblClick(controls.save())
    expect(controls.save()).toHaveTextContent('Saving…')
    expect(controls.save()).toBeDisabled()
    expect(controls.auto()).toBeDisabled()
    expect(controls.branches()).toBeDisabled()
    await screen.findByRole('status')
    expect(update).toHaveBeenCalledTimes(1)
  })

  it('keeps the edits and re-enables Save when saving fails', async () => {
    renderForm(createMockReviewApi({ failures: ['updateReviewSettings'] }))
    await userEvent.click(controls.auto())
    await userEvent.click(controls.threshold('Only critical'))
    await userEvent.click(controls.save())

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'The settings could not be saved. Try again.',
    )
    expect(controls.auto()).toHaveAttribute('aria-checked', 'false')
    expect(controls.threshold('Only critical')).toHaveAttribute('aria-checked', 'true')
    expect(controls.save()).toBeEnabled()
    expect(screen.queryByRole('status')).toBeNull()
  })

  it('explains a rejection by the server', async () => {
    const api: ReviewApi = {
      ...createMockReviewApi(),
      updateReviewSettings: () => Promise.reject(new ApiError('<b>details</b>', 422)),
    }
    renderForm(api)
    await userEvent.click(controls.threshold('All'))
    await userEvent.click(controls.save())
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'The server rejected these settings.',
    )
    expect(screen.queryByText(/details/)).toBeNull()
    expect(controls.threshold('All')).toHaveAttribute('aria-checked', 'true')
  })

  it('blocks saving while a pattern is invalid', async () => {
    const api = createMockReviewApi()
    const update = vi.spyOn(api, 'updateReviewSettings')
    renderForm(api)
    await userEvent.type(controls.branches(), '\nfeature x\nmain')
    expect(controls.branches()).toHaveAttribute('aria-invalid', 'true')
    expect(controls.branches()).toHaveAccessibleDescription(
      expect.stringContaining('“feature x” contains whitespace. “main” is repeated.'),
    )
    expect(controls.save()).toBeDisabled()
    await userEvent.click(controls.save())
    expect(update).not.toHaveBeenCalled()
  })
})

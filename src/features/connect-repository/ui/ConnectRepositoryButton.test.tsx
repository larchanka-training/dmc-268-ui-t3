import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import {
  availableRepositorySchema,
  repositoryKeys,
  useRepositories,
  type Repository,
} from '@/entities/repository'
import { ApiError, type ReviewApi } from '@/shared/api'
import { createMockReviewApi } from '@/shared/api/mock/mock-review-api'
import { mockRepositoryState } from '@/shared/api/mock/repositories.mock'
import { createTestQueryClient, renderWithProviders } from '@/shared/lib/test/render'
import { ConnectRepositoryButton } from './ConnectRepositoryButton'

const docs = availableRepositorySchema.parse(mockRepositoryState.available[2]) // not connected
const web = {
  ...availableRepositorySchema.parse(mockRepositoryState.available[0]),
  isConnected: false,
}

function ConnectedNames() {
  const { data } = useRepositories()
  return <p>{data?.map((item) => item.fullName).join(', ')}</p>
}

function Harness({ showList, onConnected }: { showList: boolean; onConnected: () => void }) {
  return (
    <>
      {showList && <ConnectedNames />}
      <ConnectRepositoryButton repository={docs} onConnected={onConnected} />
    </>
  )
}

const connectButton = () => screen.getByRole('button', { name: /^Connect/ })

describe('ConnectRepositoryButton', () => {
  it('refetches the cached connected list before calling onConnected', async () => {
    const queryClient = createTestQueryClient()
    let namesWhenConnected: string[] = []
    const onConnected = vi.fn(() => {
      const cached = queryClient.getQueryData<Repository[]>(repositoryKeys.connected) ?? []
      namesWhenConnected = cached.map((item) => item.fullName)
    })
    // The list page loaded the connected list earlier; its query is now inactive.
    const { rerender } = renderWithProviders(<Harness showList onConnected={onConnected} />, {
      queryClient,
    })
    expect(await screen.findByText(/acme\/web/)).toBeInTheDocument()
    rerender(<Harness showList={false} onConnected={onConnected} />)

    expect(connectButton()).toHaveAccessibleName('Connect acme/docs')
    await userEvent.click(connectButton())
    await waitFor(() => {
      expect(onConnected).toHaveBeenCalledOnce()
    })
    expect(namesWhenConnected).toContain('acme/docs')
  })

  it('sends one request for a double click and shows progress', async () => {
    const api = createMockReviewApi({ delayMs: 50 })
    const connectRepository = vi.spyOn(api, 'connectRepository')
    const onConnected = vi.fn()
    renderWithProviders(<ConnectRepositoryButton repository={docs} onConnected={onConnected} />, {
      api,
    })
    await userEvent.dblClick(connectButton())
    expect(connectButton()).toBeDisabled()
    expect(connectButton()).toHaveTextContent('Connecting…')
    await waitFor(() => {
      expect(onConnected).toHaveBeenCalledOnce()
    })
    expect(connectRepository).toHaveBeenCalledOnce()
    expect(connectRepository).toHaveBeenCalledWith({ provider: 'github', externalId: '810000003' })
  })

  it('treats "already connected" as success', async () => {
    const onConnected = vi.fn()
    renderWithProviders(<ConnectRepositoryButton repository={web} onConnected={onConnected} />)
    await userEvent.click(connectButton())
    await waitFor(() => {
      expect(onConnected).toHaveBeenCalledOnce()
    })
    expect(screen.queryByRole('alert')).toBeNull()
  })

  it('shows an error and allows another attempt after a server error', async () => {
    const api = createMockReviewApi({ failures: ['connectRepository'] })
    const onConnected = vi.fn()
    renderWithProviders(<ConnectRepositoryButton repository={docs} onConnected={onConnected} />, {
      api,
    })
    await userEvent.click(connectButton())
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'The repository could not be connected. Try again.',
    )
    expect(connectButton()).toBeEnabled()
    expect(connectButton()).toHaveAccessibleDescription(
      'The repository could not be connected. Try again.',
    )
    expect(onConnected).not.toHaveBeenCalled()

    api.setFailure('connectRepository', false)
    await userEvent.click(connectButton())
    await waitFor(() => {
      expect(onConnected).toHaveBeenCalledOnce()
    })
  })

  it.each([403, 404])('says the reviewer has no access on %i', async (status) => {
    const api: ReviewApi = {
      ...createMockReviewApi(),
      connectRepository: () => Promise.reject(new ApiError('denied', status)),
    }
    renderWithProviders(<ConnectRepositoryButton repository={docs} onConnected={vi.fn()} />, {
      api,
    })
    await userEvent.click(connectButton())
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'The reviewer cannot access this repository.',
    )
  })
})

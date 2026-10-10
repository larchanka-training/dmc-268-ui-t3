import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { SuggestedChange } from './SuggestedChange'

const suggestion = { startLine: 35, endLine: 36, replacement: 'DEBUG = False' }

function lines(container: HTMLElement, kind: 'del' | 'add') {
  return [...container.querySelectorAll(`[data-kind="${kind}"]`)].map((line) => line.textContent)
}

function stubClipboard(writeText: (text: string) => Promise<void>) {
  const user = userEvent.setup()
  Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true })
  return user
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('SuggestedChange', () => {
  it('shows the original lines as removed and the replacement as added', () => {
    const { container } = render(
      <SuggestedChange
        suggestion={suggestion}
        originalLines={['DEBUG = True', "ALLOWED_HOSTS = ['*']"]}
        language="python"
      />,
    )
    expect(lines(container, 'del')).toEqual([
      '35-Removed line: DEBUG = True',
      "36-Removed line: ALLOWED_HOSTS = ['*']",
    ])
    expect(lines(container, 'add')).toEqual(['+Added line: DEBUG = False'])
    expect(screen.getByText('AI suggestion · not applied')).toBeVisible()
  })

  it('describes a removal suggestion', () => {
    const { container } = render(
      <SuggestedChange
        suggestion={{ ...suggestion, replacement: '' }}
        originalLines={['DEBUG = True', 'X = 1']}
        language="python"
      />,
    )
    expect(screen.getByText('This suggestion removes these lines.')).toBeVisible()
    expect(lines(container, 'add')).toEqual([])
    expect(lines(container, 'del')).toHaveLength(2)
  })

  it('shows only the replacement when the original lines are unavailable', () => {
    const { container } = render(
      <SuggestedChange suggestion={suggestion} originalLines={null} language="python" />,
    )
    expect(screen.getByText(/original lines are not available/)).toBeVisible()
    expect(lines(container, 'del')).toEqual([])
    expect(lines(container, 'add')).toEqual(['+Added line: DEBUG = False'])
  })

  it('renders HTML in suggested code literally and offers no apply action', () => {
    const payload = '<img src=x onerror=alert(1)>'
    const { container } = render(
      <SuggestedChange
        suggestion={{ ...suggestion, replacement: payload }}
        originalLines={null}
        language="html"
      />,
    )
    expect(container.querySelector('img')).toBeNull()
    expect(container).toHaveTextContent(payload)
    const buttons = within(screen.getByRole('region', { name: 'Suggested change' }))
      .getAllByRole('button')
      .map((button) => button.textContent)
    expect(buttons).toEqual(['Copy suggestion'])
  })

  it('copies the exact replacement and announces it', async () => {
    const writeText = vi.fn(() => Promise.resolve())
    const user = stubClipboard(writeText)
    render(
      <SuggestedChange
        suggestion={{ ...suggestion, replacement: 'a\n  b' }}
        originalLines={null}
        language="ts"
      />,
    )
    await user.click(screen.getByRole('button', { name: 'Copy suggestion' }))
    expect(writeText).toHaveBeenCalledWith('a\n  b')
    expect(await screen.findByRole('status')).toHaveTextContent('Copied')
  })

  it('shows an error and stays usable when copying fails', async () => {
    const user = stubClipboard(() => Promise.reject(new Error('denied')))
    render(<SuggestedChange suggestion={suggestion} originalLines={null} language="python" />)
    const button = screen.getByRole('button', { name: 'Copy suggestion' })
    await user.click(button)
    expect(await screen.findByRole('alert')).toHaveTextContent('could not be copied')
    expect(screen.getByRole('status')).toHaveTextContent('')
    expect(button).toBeEnabled()
  })
})

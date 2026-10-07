import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ProviderBadge, VisibilityBadge } from './RepositoryBadges'

describe('ProviderBadge', () => {
  it.each([
    ['github', 'GitHub'],
    ['gitlab', 'GitLab'],
  ] as const)('labels %s as %s', (provider, label) => {
    render(<ProviderBadge provider={provider} />)
    expect(screen.getByText(label)).toBeInTheDocument()
  })
})

describe('VisibilityBadge', () => {
  it('labels private and public repositories', () => {
    const { rerender } = render(<VisibilityBadge isPrivate />)
    expect(screen.getByText('Private')).toBeInTheDocument()
    rerender(<VisibilityBadge isPrivate={false} />)
    expect(screen.getByText('Public')).toBeInTheDocument()
  })
})

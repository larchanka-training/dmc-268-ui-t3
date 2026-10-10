import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { findingListSchema, type Finding } from '@/entities/finding'
import { reviewRunSchema } from '@/entities/review-run'
import type { ReviewRunWire } from '@/shared/api'
import { mockAppState } from '@/shared/api/mock/app-state.mock'
import { PullRequestOverview } from './PullRequestOverview'

const bare: ReviewRunWire = {
  ...mockAppState.server.run,
  author: undefined,
  base_branch: undefined,
  head_branch: undefined,
  pull_request_url: undefined,
}
const full: ReviewRunWire = {
  ...bare,
  author: { login: 'octocat', avatar_url: 'https://avatars.example.com/u/1' },
  base_branch: 'main',
  head_branch: 'feature/search',
  pull_request_url: 'https://github.com/larchanka-training/dmc-268-demo/pull/42',
}
const findings = findingListSchema.parse(mockAppState.server.findings)

function renderRun(wire: Partial<ReviewRunWire> = {}, items: Finding[] = findings) {
  const run = reviewRunSchema.parse({ ...full, ...wire })
  return render(<PullRequestOverview run={run} findings={items} />)
}

const verdict = () => within(screen.getByRole('group', { name: 'Review verdict' }))

describe('PullRequestOverview: identity', () => {
  it('shows the title as the page heading with repository, number and short SHA', () => {
    renderRun()
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Add user search endpoint')
    expect(screen.getByText('larchanka-training/dmc-268-demo #42')).toBeVisible()
    expect(screen.getByText(full.head_sha.slice(0, 7))).toBeVisible()
  })

  it('shows the author with their avatar', () => {
    renderRun()
    expect(screen.getByRole('img', { name: 'octocat' })).toHaveAttribute(
      'src',
      'https://avatars.example.com/u/1',
    )
    expect(screen.getByText('octocat')).toBeVisible()
  })

  it('falls back to the login initial without an avatar URL', () => {
    renderRun({ author: { login: 'octocat', avatar_url: null } })
    expect(screen.getByTestId('avatar-fallback')).toHaveTextContent('O')
    expect(screen.queryByRole('img')).toBeNull()
  })

  it('shows branches as base ← head with a spoken merge direction', () => {
    renderRun()
    expect(screen.getByText('Merges feature/search into main')).toBeInTheDocument()
    expect(screen.getByText('main')).toBeVisible()
    expect(screen.getByText('feature/search')).toBeVisible()
  })

  it('leaves the branches out when one is missing', () => {
    renderRun({ head_branch: null })
    expect(screen.queryByText(/Merges/)).toBeNull()
    expect(screen.queryByText('main')).toBeNull()
  })

  it('links to the pull request in a new tab without opener access', () => {
    renderRun()
    const link = screen.getByRole('link', { name: /View pull request/ })
    expect(link).toHaveAttribute('href', full.pull_request_url)
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')
  })

  it('still renders an older payload without any metadata', () => {
    const run = reviewRunSchema.parse(bare)
    render(<PullRequestOverview run={run} findings={findings} />)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Add user search endpoint')
    expect(screen.getByText('Run: Completed')).toBeVisible()
    expect(screen.getByText('Coverage: Partial')).toBeVisible()
    expect(screen.getByText('Summary published')).toBeVisible()
    expect(screen.queryByRole('link')).toBeNull()
    expect(screen.queryByRole('img')).toBeNull()
    expect(screen.queryByText(/unknown/i)).toBeNull()
  })
})

describe('PullRequestOverview: verdict and score', () => {
  const complete = { status: 'complete' as const, limitations: [] }

  it('requests changes with a critical finding and explains the missing partial score', () => {
    renderRun()
    expect(verdict().getByText('Changes requested')).toBeVisible()
    expect(verdict().getByText('Score unavailable because coverage is partial.')).toBeVisible()
    expect(verdict().queryByText(/out of 100/)).toBeNull()
  })

  it('shows the heuristic score for a complete review', () => {
    // Fixture: 1 critical, 3 high, 2 medium, 1 low → 100 − 25 − 24 − 8 − 1 = 42.
    renderRun({ coverage: complete })
    expect(verdict().getByText('42')).toBeVisible()
    expect(verdict().getByText('Heuristic, not a quality guarantee.')).toBeVisible()
  })

  it('keeps the verdict when the only critical finding is resolved', () => {
    const resolved = findings.map((finding) =>
      finding.severity === 'critical' ? { ...finding, status: 'resolved' as const } : finding,
    )
    renderRun({}, resolved)
    expect(verdict().getByText('Changes requested')).toBeVisible()
  })

  it('says the review is in progress and shows no score while running', () => {
    renderRun({ status: 'RUNNING', coverage: complete })
    expect(verdict().getByText('Review in progress')).toBeVisible()
    expect(verdict().queryByText(/out of 100/)).toBeNull()
  })

  it('gives no verdict for a failed run', () => {
    renderRun({ status: 'FAILED' })
    expect(verdict().getByText('No verdict')).toBeVisible()
    expect(verdict().getByText(/not reviewed/)).toBeVisible()
  })

  it('reports a partially reviewed change with only info findings', () => {
    const info = findings.filter((finding) => finding.severity === 'low')
    renderRun({}, info)
    expect(verdict().getByText('Partially reviewed')).toBeVisible()
    expect(screen.queryByText('No blocking issues')).toBeNull()
  })

  it('reports no blocking issues for a clean complete review', () => {
    renderRun({ coverage: complete }, [])
    expect(verdict().getByText('No blocking issues')).toBeVisible()
    expect(verdict().getByText('100')).toBeVisible()
  })
})

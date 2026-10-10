import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { mockAppState } from '@/shared/api/mock/app-state.mock'
import { findingListSchema, type Finding } from '../model/schema'
import { FindingCard } from './FindingCard'

const findings = findingListSchema.parse(mockAppState.server.findings)
const byId = (id: string): Finding => {
  const finding = findings.find((item) => item.id === id)
  if (!finding) throw new Error(id)
  return finding
}

describe('FindingCard', () => {
  it('shows all finding fields with a text severity label', () => {
    render(<FindingCard finding={byId('f-reflected-xss')} />)
    expect(screen.getByText('High')).toHaveAttribute('data-severity', 'high')
    expect(
      screen.getByRole('heading', { name: 'Search term is reflected into HTML without escaping' }),
    ).toBeVisible()
    expect(screen.getByText('SEC-XSS-002')).toBeVisible()
    expect(screen.getByText(/Attackers can run script/)).toBeVisible()
    expect(screen.getByText(/Return JSON, or escape term/)).toBeVisible()
    expect(screen.getByText(/Confidence 90%/)).toHaveTextContent('(model estimate, not proof)')
  })

  it('renders markup in model text literally', () => {
    const finding = {
      ...byId('f-sql-injection'),
      evidence: '<script>alert(1)</script><img src=x onerror=alert(1)>',
    }
    const { container } = render(<FindingCard finding={finding} />)
    expect(screen.getByText(finding.evidence)).toBeVisible()
    expect(container.querySelector('script, img')).toBeNull()
  })

  it('collapses a resolved finding and keeps its content when expanded', async () => {
    const finding = byId('f-wildcard-hosts')
    render(<FindingCard finding={finding} />)
    expect(screen.getByText('Resolved')).toBeVisible()
    expect(screen.getByText(finding.evidence)).not.toBeVisible()
    await userEvent.click(screen.getByRole('button', { name: 'Show finding details' }))
    expect(screen.getByText(finding.evidence)).toBeVisible()
    expect(screen.getByText('Medium')).toBeVisible()
    expect(screen.getByRole('list', { name: 'Replies' }).children).toHaveLength(2)
  })

  it('reports clicks on related changed lines', async () => {
    const onRelatedLineClick = vi.fn()
    const finding = byId('f-null-check')
    render(<FindingCard finding={finding} onRelatedLineClick={onRelatedLineClick} />)
    await userEvent.click(screen.getByRole('button', { name: 'src/services/user-service.ts:L21' }))
    expect(onRelatedLineClick).toHaveBeenCalledWith(finding.relatedChangedLines[1])
  })
})

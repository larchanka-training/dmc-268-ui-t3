import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { mockRepositoryState } from '@/shared/api/mock/repositories.mock'
import { repositoryRulesSchema, type Rule } from '../model/schema'
import { RuleList } from './RuleList'
import { RulesStatusBadge } from './RulesStatusBadge'

describe('RulesStatusBadge', () => {
  it.each([
    ['custom', 'Custom rules'],
    ['missing', 'Default rules'],
    ['invalid', 'Rules file invalid'],
  ] as const)('labels %s as "%s"', (status, label) => {
    render(<RulesStatusBadge status={status} />)
    expect(screen.getByText(label)).toBeInTheDocument()
  })
})

describe('RuleList', () => {
  const { rules } = repositoryRulesSchema.parse(mockRepositoryState.rules['repo-1'])

  function items() {
    return within(screen.getByRole('list', { name: 'Rules in effect' })).getAllByRole('listitem')
  }

  it('lists the rules in order with their details', () => {
    render(<RuleList rules={rules} label="Rules in effect" />)
    const [secret, a11y, style] = items()
    expect(secret).toHaveTextContent('SEC-001')
    expect(secret).toHaveTextContent('No hardcoded secrets')
    expect(secret).toHaveTextContent('Severity: Critical')
    expect(secret).toHaveTextContent('Category: security')
    expect(secret).toHaveTextContent('Enabled')
    expect(a11y).toHaveTextContent('High (Warning)')
    expect(style).toHaveTextContent('Low (Info)')
    expect(style).toHaveTextContent('Disabled')
    expect(style).toHaveTextContent('Modules use named exports so imports stay greppable.')
  })

  it('offers no control that changes a rule', () => {
    const { container } = render(<RuleList rules={rules} label="Rules in effect" />)
    expect(container.querySelectorAll('input, button, select, textarea')).toHaveLength(0)
    expect(screen.queryByRole('switch')).toBeNull()
  })

  it('renders markup in a rule as text', () => {
    const rule: Rule = {
      ...rules[0],
      description: '<img src=x onerror=alert(1)>',
    }
    const { container } = render(<RuleList rules={[rule]} label="Rules in effect" />)
    expect(container.querySelector('img')).toBeNull()
    expect(screen.getByText('<img src=x onerror=alert(1)>')).toBeInTheDocument()
  })
})

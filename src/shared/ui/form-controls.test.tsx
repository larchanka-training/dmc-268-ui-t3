import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { RadioGroup, RadioGroupItem } from './radio-group'
import { Switch } from './switch'

describe('Switch', () => {
  it('toggles with Space', async () => {
    const user = userEvent.setup()
    render(<Switch aria-label="Automatic review" />)
    const control = screen.getByRole('switch', { name: 'Automatic review' })
    expect(control).toHaveAttribute('aria-checked', 'false')
    control.focus()
    await user.keyboard(' ')
    expect(control).toHaveAttribute('aria-checked', 'true')
  })
})

describe('RadioGroup', () => {
  it('moves focus with the arrow keys and selects with Space', async () => {
    const user = userEvent.setup()
    render(
      <RadioGroup aria-label="Threshold" defaultValue="a">
        <RadioGroupItem value="a" aria-label="A" />
        <RadioGroupItem value="b" aria-label="B" />
      </RadioGroup>,
    )
    const a = screen.getByRole('radio', { name: 'A' })
    const b = screen.getByRole('radio', { name: 'B' })
    await user.tab()
    expect(a).toHaveFocus()
    await user.keyboard('{ArrowDown}')
    expect(b).toHaveFocus()
    // Browsers also select on arrow focus; jsdom does not, so select explicitly.
    await user.keyboard(' ')
    expect(b).toHaveAttribute('aria-checked', 'true')
    expect(a).toHaveAttribute('aria-checked', 'false')
  })
})

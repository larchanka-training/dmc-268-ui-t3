import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { CodeBlock } from './code-block'

describe('CodeBlock', () => {
  it('numbers lines from startLine and highlights the selected line', () => {
    const { container } = render(
      <CodeBlock
        code={['a', 'b', 'c', 'd', 'e'].join('\n')}
        language="ts"
        startLine={40}
        highlightLines={[42]}
      />,
    )
    const lines = [...container.querySelectorAll('[data-line]')]
    expect(lines.map((line) => line.getAttribute('data-line'))).toEqual([
      '40',
      '41',
      '42',
      '43',
      '44',
    ])
    expect(
      lines.filter((line) => line.hasAttribute('data-highlighted')).map((line) => line.textContent),
    ).toEqual(['42c'])
  })

  it('renders HTML in code as literal text', () => {
    const payload = '<img src=x onerror=alert(1)>'
    const { container } = render(<CodeBlock code={payload} language="html" />)
    expect(screen.getByText(payload)).toBeInTheDocument()
    expect(container.querySelector('img')).toBeNull()
  })

  it('renders plain text while the highlighter is loading', () => {
    const { container } = render(<CodeBlock code="const a = 1" language="typescript" />)
    expect(container.querySelector('.code-token')).toBeNull()
    expect(screen.getByText('const a = 1')).toBeInTheDocument()
  })
})

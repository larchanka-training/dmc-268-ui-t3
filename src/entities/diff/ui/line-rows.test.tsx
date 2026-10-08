import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { findLineElement } from '@/shared/lib/line-anchor'
import type { DiffLine } from '../model/types'
import { SplitLineRow, UnifiedLineRow } from './line-rows'

const paths = { oldPath: 'a.ts', newPath: 'a.ts' }
const add: DiffLine = { kind: 'add', content: 'added()', oldNo: null, newNo: 11 }
const del: DiffLine = { kind: 'del', content: 'removed()', oldNo: 11, newNo: null }
const ctx: DiffLine = { kind: 'ctx', content: 'same()', oldNo: 10, newNo: 10 }

describe('UnifiedLineRow', () => {
  it.each([
    [add, '+', 'Added line'],
    [del, '-', 'Removed line'],
    [ctx, ' ', 'Unchanged line'],
  ])('exposes the change type of a %o line as text, not only color', (line, marker, label) => {
    render(<UnifiedLineRow line={line} tokens={null} paths={paths} flashed={false} />)
    const row = screen.getByRole('row')
    expect(row).toHaveAttribute('data-kind', line.kind)
    expect(row.textContent).toContain(`${label}: ${marker}${line.content}`)
  })

  it('can be found by the anchors of both sides of a context line', () => {
    const { container } = render(
      <UnifiedLineRow line={ctx} tokens={null} paths={paths} flashed={false} />,
    )
    const row = screen.getByRole('row')
    expect(findLineElement({ path: 'a.ts', side: 'LEFT', line: 10 }, container)).toBe(row)
    expect(findLineElement({ path: 'a.ts', side: 'RIGHT', line: 10 }, container)).toBe(row)
    expect(findLineElement({ path: 'a.ts', side: 'RIGHT', line: 11 }, container)).toBeNull()
  })
})

describe('line markers', () => {
  const marker = <button type="button">flag</button>
  const cells = () => screen.getAllByRole('cell')

  it('puts a unified marker in the new-number gutter of an added line', () => {
    render(
      <UnifiedLineRow line={add} tokens={null} paths={paths} flashed={false} marker={marker} />,
    )
    expect(cells()[1]).toContainElement(screen.getByRole('button', { name: 'flag' }))
  })

  it('puts a unified marker in the old-number gutter of a removed line', () => {
    render(
      <UnifiedLineRow line={del} tokens={null} paths={paths} flashed={false} marker={marker} />,
    )
    expect(cells()[0]).toContainElement(screen.getByRole('button', { name: 'flag' }))
  })

  it('puts split markers in the gutter of their side', () => {
    render(
      <SplitLineRow
        left={del}
        right={add}
        tokensFor={() => null}
        paths={paths}
        flashed={false}
        markers={{ RIGHT: marker }}
      />,
    )
    expect(cells()[2]).toContainElement(screen.getByRole('button', { name: 'flag' }))
    expect(cells()[0]).not.toContainElement(screen.getByRole('button', { name: 'flag' }))
  })
})

describe('SplitLineRow', () => {
  it('renders an empty filler cell when one side has no line', () => {
    render(
      <SplitLineRow left={null} right={add} tokensFor={() => null} paths={paths} flashed={false} />,
    )
    expect(screen.getByText('No line')).toBeInTheDocument()
    expect(screen.getByRole('row')).toHaveTextContent('Added line: +added()')
  })
})

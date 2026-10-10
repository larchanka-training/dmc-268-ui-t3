import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { diffViewStore } from '@/entities/diff'
import { findingNavStore } from '@/entities/finding'
import { mockAppState } from '@/shared/api/mock/app-state.mock'
import { createMockReviewApi } from '@/shared/api/mock/mock-review-api'
import { findLineElement } from '@/shared/lib/line-anchor'
import { renderWithProviders } from '@/shared/lib/test/render'
import { DiffViewer } from './DiffViewer'
import {
  finding,
  fixtureFiles,
  fixtureFindings,
  longFileContent,
  longFileDiff,
  parseFiles,
  RUN,
  toFindings,
} from './test-fixtures'

const USER_SERVICE = 'src/services/user-service.ts'

function renderFixture() {
  return renderWithProviders(
    <DiffViewer runId={RUN} files={fixtureFiles} findings={fixtureFindings} />,
  )
}

function renderLongFile(findings = toFindings([])) {
  const api = createMockReviewApi({
    state: {
      ...mockAppState.server,
      diffText: longFileDiff,
      fileContents: { 'long.ts': longFileContent },
    },
  })
  return renderWithProviders(
    <DiffViewer runId={RUN} files={parseFiles(longFileDiff)} findings={findings} />,
    { api },
  )
}

const fileSection = (path: string) => screen.getByRole('region', { name: `File ${path}` })
const table = (path: string) => within(fileSection(path)).getByRole('table')
const gapTexts = (path: string) =>
  within(table(path))
    .queryAllByText(/hidden lines?$/)
    .map((node) => node.textContent)

/** The gap row whose label is `text`, once its expand controls are ready. */
async function gapRow(path: string, text: string) {
  const row = (await within(table(path)).findByText(text)).closest('[role="row"]') as HTMLElement
  await within(row).findByRole('button', { name: 'Expand all' })
  return within(row)
}

/** The row that renders a line, and the row right after it. */
function rowAndNext(anchor: Parameters<typeof findLineElement>[0]) {
  const row = findLineElement(anchor)
  if (!row) throw new Error(`no row for ${JSON.stringify(anchor)}`)
  return { row, next: row.nextElementSibling as HTMLElement | null }
}

beforeEach(() => {
  diffViewStore.getState().actions.reset()
  findingNavStore.getState().actions.reset()
})

describe('DiffViewer: files', () => {
  it('shows a header with path, change type and line counts for every file', () => {
    renderFixture()
    const renamed = within(fileSection('src/utils/formatting.ts'))
    expect(renamed.getByRole('heading', { level: 2 })).toHaveTextContent(
      'src/utils/format.ts → src/utils/formatting.ts',
    )
    expect(renamed.getByText('Renamed')).toBeVisible()
    expect(within(fileSection('src/api/search-endpoint.ts')).getByText('Added')).toBeVisible()
    expect(within(fileSection('src/legacy/old-helper.js')).getByText('Deleted')).toBeVisible()
    const modified = within(fileSection(USER_SERVICE))
    expect(modified.getByText('Modified')).toBeVisible()
    expect(modified.getByText('(5 added, 3 removed lines)', { exact: false })).toBeInTheDocument()
  })

  it('collapses and expands a file body while keeping the header', async () => {
    renderFixture()
    const path = 'src/api/search-endpoint.ts'
    await userEvent.click(screen.getByRole('button', { name: `Collapse ${path}` }))
    expect(within(fileSection(path)).queryByRole('table')).toBeNull()
    expect(within(fileSection(path)).getByText('+8')).toBeVisible()
    await userEvent.click(screen.getByRole('button', { name: `Expand ${path}` }))
    expect(within(fileSection(path)).getByRole('table')).toBeVisible()
  })

  it('shows a notice instead of the body for binary files', () => {
    renderFixture()
    expect(within(fileSection('assets/logo.png')).getByText('Binary file not shown.')).toBeVisible()
  })

  it('starts very large files collapsed', () => {
    const lines = Array.from({ length: 1001 }, (_, i) => `+l${String(i)}`)
    const text = [
      'diff --git a/big.ts b/big.ts',
      '--- /dev/null',
      '+++ b/big.ts',
      '@@ -0,0 +1,1001 @@',
      ...lines,
      '',
    ].join('\n')
    renderWithProviders(<DiffViewer runId={RUN} files={parseFiles(text)} findings={[]} />)
    expect(screen.getByRole('button', { name: 'Expand big.ts' })).toHaveAttribute(
      'aria-expanded',
      'false',
    )
    expect(within(fileSection('big.ts')).queryByRole('table')).toBeNull()
  })
})

describe('DiffViewer: view modes', () => {
  it('switches every file to split mode and keeps expanded gaps and findings', async () => {
    renderLongFile(
      toFindings([
        finding({ finding_id: 'f1', anchor: { path: 'long.ts', side: 'RIGHT', line: 51 } }),
      ]),
    )
    await userEvent.click(
      (await gapRow('long.ts', '50 hidden lines')).getByRole('button', { name: 'Expand all' }),
    )
    await userEvent.click(
      (await gapRow('long.ts', '49 hidden lines')).getByRole('button', { name: 'Expand all' }),
    )
    expect(gapTexts('long.ts')).toEqual([])
    await userEvent.click(screen.getByRole('radio', { name: 'Split' }))
    expect(table('long.ts')).toHaveAttribute('data-mode', 'split')
    expect(gapTexts('long.ts')).toEqual([])
    expect(screen.getByRole('article', { name: 'Finding: Finding f1' })).toBeVisible()
  })

  it('renders split mode for all files in the fixture', async () => {
    renderFixture()
    await userEvent.click(screen.getByRole('radio', { name: 'Split' }))
    for (const element of screen.getAllByRole('table')) {
      expect(element).toHaveAttribute('data-mode', 'split')
    }
  })
})

describe('DiffViewer: expandable context', () => {
  it('reveals 20 lines at a time with correct numbers', async () => {
    renderLongFile()
    const gap = await gapRow('long.ts', '50 hidden lines')
    await userEvent.click(gap.getByRole('button', { name: 'Expand 20 lines' }))
    expect(within(table('long.ts')).getByText('30 hidden lines')).toBeVisible()
    // The gap before the first hunk grows upwards: lines 31..50 are now shown.
    expect(findLineElement({ path: 'long.ts', side: 'RIGHT', line: 31 })).toHaveTextContent(
      'line 31',
    )
    expect(findLineElement({ path: 'long.ts', side: 'LEFT', line: 50 })).toHaveTextContent(
      'line 50',
    )
    expect(findLineElement({ path: 'long.ts', side: 'RIGHT', line: 30 })).toBeNull()
  })

  it('removes the control after expanding the whole gap', async () => {
    renderLongFile()
    const gap = await gapRow('long.ts', '50 hidden lines')
    await userEvent.click(gap.getByRole('button', { name: 'Expand all' }))
    expect(within(table('long.ts')).queryByText('50 hidden lines')).toBeNull()
    expect(findLineElement({ path: 'long.ts', side: 'RIGHT', line: 1 })).toHaveTextContent('line 1')
  })

  it('shows hidden line counts without actions when file content is unavailable', async () => {
    renderFixture()
    const settings = within(table('config/settings.py'))
    expect(await settings.findByText(/content is unavailable/)).toBeVisible()
    expect(settings.getByText('31 hidden lines')).toBeVisible()
    expect(settings.queryByRole('button', { name: /Expand/ })).toBeNull()
  })

  it('expands with the keyboard', async () => {
    renderLongFile()
    const gap = await gapRow('long.ts', '50 hidden lines')
    gap.getByRole('button', { name: 'Expand 20 lines' }).focus()
    await userEvent.keyboard('{Enter}')
    expect(within(table('long.ts')).getByText('30 hidden lines')).toBeVisible()
  })
})

describe('DiffViewer: inline findings', () => {
  it('shows a RIGHT-side finding directly below its line in unified mode', async () => {
    renderFixture()
    await waitFor(() => {
      expect(findLineElement({ path: USER_SERVICE, side: 'RIGHT', line: 46 })).not.toBeNull()
    })
    const { next } = rowAndNext({ path: USER_SERVICE, side: 'RIGHT', line: 46 })
    expect(next).toHaveAccessibleName('Review findings')
    expect(
      within(next as HTMLElement).getByText('User input is interpolated into a SQL query'),
    ).toBeVisible()
  })

  it('shows a LEFT-side finding under the LEFT column in split mode', async () => {
    renderFixture()
    await userEvent.click(screen.getByRole('radio', { name: 'Split' }))
    const { next } = rowAndNext({ path: USER_SERVICE, side: 'LEFT', line: 20 })
    const left = (next as HTMLElement).querySelector('[data-side="LEFT"]') as HTMLElement
    const right = (next as HTMLElement).querySelector('[data-side="RIGHT"]') as HTMLElement
    expect(within(left).getByText('Empty id guard was removed from getUser')).toBeVisible()
    expect(right).toBeEmptyDOMElement()
  })

  it('orders several findings on one line by severity', () => {
    const anchor = { path: 'long.ts', side: 'RIGHT', line: 51 } as const
    renderLongFile(
      toFindings([
        finding({ finding_id: 'low', anchor, severity: 'low' }),
        finding({ finding_id: 'critical', anchor, severity: 'critical' }),
        finding({ finding_id: 'medium', anchor, severity: 'medium' }),
      ]),
    )
    const titles = screen
      .getAllByRole('heading', { level: 3 })
      .map((heading) => heading.textContent)
    expect(titles).toEqual(['Finding critical', 'Finding medium', 'Finding low'])
  })

  it('expands a collapsed gap to show a finding anchored on an unchanged line', async () => {
    renderFixture()
    const anchor = { path: USER_SERVICE, side: 'RIGHT', line: 35 } as const
    await waitFor(() => {
      expect(findLineElement(anchor)).not.toBeNull()
    })
    const { row, next } = rowAndNext(anchor)
    expect(row).toHaveTextContent("await db.query('UPDATE users SET active = false")
    expect(
      within(next as HTMLElement).getByText('deactivateUser accepts an empty id as well'),
    ).toBeVisible()
  })

  it('lists findings whose line does not exist in the file as unplaced', () => {
    renderFixture()
    const unplaced = within(fileSection('src/utils/formatting.ts')).getByRole('region', {
      name: 'Unplaced findings',
    })
    expect(
      within(unplaced).getByText('Locale default duplicates the app-wide locale setting'),
    ).toBeVisible()
  })
})

describe('DiffViewer: related line navigation', () => {
  it('scrolls to and highlights a related changed line', async () => {
    const scrollIntoView = vi.spyOn(Element.prototype, 'scrollIntoView')
    renderFixture()
    const card = await screen.findByRole('article', {
      name: 'Finding: Empty id guard was removed from getUser',
    })
    await userEvent.click(within(card).getByRole('button', { name: `${USER_SERVICE}:L21` }))
    const row = findLineElement({ path: USER_SERVICE, side: 'LEFT', line: 21 })
    expect(row).toHaveAttribute('data-flashed', 'true')
    expect(scrollIntoView.mock.contexts).toContain(row)
  })
})

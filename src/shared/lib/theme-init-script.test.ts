import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { beforeEach, describe, expect, it } from 'vitest'
import { THEME_STORAGE_KEY } from './theme'

const html = readFileSync(resolve(process.cwd(), 'index.html'), 'utf8')
const script = /<script id="theme-init">([\s\S]*?)<\/script>/.exec(html)?.[1] ?? ''

function runScript() {
  // Same code the browser runs from index.html before the bundle loads.
  // eslint-disable-next-line @typescript-eslint/no-implied-eval
  const run = new Function(script) as () => void
  run()
}

describe('index.html theme-init script', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.removeAttribute('data-theme')
  })

  it('reads the same storage key as the theme store', () => {
    expect(script).toContain(`'${THEME_STORAGE_KEY}'`)
  })

  it('applies a stored dark preference', () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'dark')
    runScript()
    expect(document.documentElement).toHaveAttribute('data-theme', 'dark')
  })

  it('leaves system and unknown values to the OS', () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'system')
    runScript()
    localStorage.setItem(THEME_STORAGE_KEY, '"><img src=x>')
    runScript()
    expect(document.documentElement).not.toHaveAttribute('data-theme')
  })
})

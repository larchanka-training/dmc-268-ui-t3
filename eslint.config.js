import js from '@eslint/js'
import prettierConfig from 'eslint-config-prettier'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'
import globals from 'globals'
import tseslint from 'typescript-eslint'

// Feature-Sliced Design layers, highest first. A layer may import only from
// the layers listed after it. See FRONTEND_ARCHITECTURE.md.
const LAYERS = ['app', 'pages', 'widgets', 'features', 'entities', 'shared']
const SLICED_LAYERS = ['pages', 'widgets', 'features', 'entities']

/** no-restricted-imports blocks for one layer: bans upper layers, cross-slice and deep imports. */
function layerBoundaries(layer) {
  const index = LAYERS.indexOf(layer)
  const upper = LAYERS.slice(0, index)
  const lower = LAYERS.slice(index + 1)
  const patterns = [
    ...upper.map((name) => ({
      group: [`@/${name}`, `@/${name}/**`],
      message: `FSD: the "${layer}" layer must not import from the higher "${name}" layer.`,
    })),
    ...lower
      .filter((name) => SLICED_LAYERS.includes(name))
      .map((name) => ({
        group: [`@/${name}/*/**`],
        message: `FSD: import ${name} slices only through its public API (@/${name}/<slice>).`,
      })),
  ]
  if (SLICED_LAYERS.includes(layer)) {
    patterns.push(
      {
        group: [`@/${layer}/**`],
        message: `FSD: slices of the "${layer}" layer must not import each other; inside a slice use relative imports.`,
      },
      {
        group: ['../../**'],
        message: 'FSD: relative imports must not leave the slice; use the slice public API via @/.',
      },
    )
  }
  const blocks = [
    {
      files: [`src/${layer}/**/*.{ts,tsx}`],
      rules: { 'no-restricted-imports': ['error', { patterns }] },
    },
  ]
  if (SLICED_LAYERS.includes(layer)) {
    // A slice's index.ts sits at the slice root, so a single "../" already leaves the slice.
    blocks.push({
      files: [`src/${layer}/*/index.ts`],
      rules: {
        'no-restricted-imports': [
          'error',
          {
            patterns: [
              ...patterns,
              {
                group: ['../**'],
                message: 'FSD: a slice public API must only re-export its own modules.',
              },
            ],
          },
        ],
      },
    })
  }
  return blocks
}

export default defineConfig([
  globalIgnores(['dist', 'node_modules', 'coverage']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.strictTypeChecked,
      reactHooks.configs.flat['recommended-latest'],
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      // TanStack Router's `throw redirect(...)` throws a Response-based Redirect by design.
      '@typescript-eslint/only-throw-error': [
        'error',
        { allow: [{ from: 'package', package: '@tanstack/router-core', name: 'Redirect' }] },
      ],
    },
  },
  ...LAYERS.flatMap(layerBoundaries),
  // Last: turns off stylistic rules that would fight Prettier.
  prettierConfig,
])

/** Languages bundled into the highlighter; anything else renders as plain text. */
export const LANGUAGES = [
  'typescript',
  'tsx',
  'javascript',
  'jsx',
  'json',
  'css',
  'html',
  'markdown',
  'python',
  'go',
  'java',
  'php',
  'yaml',
  'shellscript',
] as const

export type LanguageId = (typeof LANGUAGES)[number] | 'text'

const BY_EXTENSION: Record<string, LanguageId> = {
  ts: 'typescript',
  mts: 'typescript',
  cts: 'typescript',
  tsx: 'tsx',
  js: 'javascript',
  mjs: 'javascript',
  cjs: 'javascript',
  jsx: 'jsx',
  json: 'json',
  css: 'css',
  html: 'html',
  htm: 'html',
  md: 'markdown',
  py: 'python',
  go: 'go',
  java: 'java',
  php: 'php',
  yml: 'yaml',
  yaml: 'yaml',
  sh: 'shellscript',
  bash: 'shellscript',
  zsh: 'shellscript',
}

function isLanguageId(value: string): value is LanguageId {
  return value === 'text' || (LANGUAGES as readonly string[]).includes(value)
}

/** Language for a file path, from its extension. Unknown extensions map to "text". */
export function languageFromPath(path: string): LanguageId {
  const name = path.split('/').at(-1) ?? ''
  const dot = name.lastIndexOf('.')
  if (dot <= 0) return 'text'
  return BY_EXTENSION[name.slice(dot + 1).toLowerCase()] ?? 'text'
}

/** Accepts a language id ("typescript") or an extension ("ts"). */
export function resolveLanguage(nameOrExtension: string): LanguageId {
  const value = nameOrExtension.toLowerCase()
  if (isLanguageId(value)) return value
  return BY_EXTENSION[value] ?? 'text'
}

import type { HighlighterCore } from 'shiki/core'
import { resolveLanguage } from './language'
import type { HighlightedLine, Highlighter } from './types'

let loaded: Highlighter | null = null
let loading: Promise<Highlighter> | null = null

export function plainLines(code: string): HighlightedLine[] {
  return code.split('\n').map((content) => [{ content }])
}

function wrap(core: HighlighterCore): Highlighter {
  return {
    tokenize(code, language) {
      const lang = resolveLanguage(language)
      if (lang === 'text') return plainLines(code)
      const { tokens } = core.codeToTokens(code, {
        lang,
        themes: { light: 'github-light', dark: 'github-dark' },
        defaultColor: false,
      })
      return tokens.map((line) =>
        line.map((token) => ({
          content: token.content,
          style: token.htmlStyle,
        })),
      )
    },
  }
}

/** The highlighter if it has finished loading, otherwise null. */
export function getLoadedHighlighter(): Highlighter | null {
  return loaded
}

async function createCore(): Promise<HighlighterCore> {
  const [{ createHighlighterCore }, { createJavaScriptRegexEngine }] = await Promise.all([
    import('shiki/core'),
    import('shiki/engine/javascript'),
  ])
  return createHighlighterCore({
    themes: [import('shiki/themes/github-light.mjs'), import('shiki/themes/github-dark.mjs')],
    langs: [
      import('shiki/langs/typescript.mjs'),
      import('shiki/langs/tsx.mjs'),
      import('shiki/langs/javascript.mjs'),
      import('shiki/langs/jsx.mjs'),
      import('shiki/langs/json.mjs'),
      import('shiki/langs/css.mjs'),
      import('shiki/langs/html.mjs'),
      import('shiki/langs/markdown.mjs'),
      import('shiki/langs/python.mjs'),
      import('shiki/langs/go.mjs'),
      import('shiki/langs/java.mjs'),
      import('shiki/langs/php.mjs'),
      import('shiki/langs/yaml.mjs'),
      import('shiki/langs/shellscript.mjs'),
    ],
    engine: createJavaScriptRegexEngine(),
  })
}

/** Loads the highlighter once; Shiki, its grammars and themes are separate lazy chunks. */
export function loadHighlighter(): Promise<Highlighter> {
  loading ??= createCore().then((core) => {
    loaded = wrap(core)
    return loaded
  })
  return loading
}

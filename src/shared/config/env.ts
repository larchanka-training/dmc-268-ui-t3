import { z } from 'zod'

export const AUTH_MODES = ['mock', 'github'] as const
export type AuthMode = (typeof AUTH_MODES)[number]

export const CALLBACK_PATH = '/auth/callback'

export interface AppConfig {
  authMode: AuthMode
  /** GitHub App client ID; null in mock mode when it is not set. */
  githubClientId: string | null
  /** Absolute URL GitHub redirects back to; must match the GitHub App settings. */
  githubRedirectUri: string
  /** Base URL of the backend API, same-site with the SPA. */
  apiBaseUrl: string
  /** GitHub App installation page for adding repositories; null when no app slug is set. */
  githubAppInstallUrl: string | null
}

export interface ConfigIssue {
  variable: string
  message: string
}

export type ConfigResult = { ok: true; config: AppConfig } | { ok: false; issues: ConfigIssue[] }

/** `.env` lines like `VITE_X=` arrive as empty strings; treat them as unset. */
const optional = z.preprocess(
  (value) => (typeof value === 'string' && value.trim() === '' ? undefined : value),
  z.string().trim().optional(),
)

const envSchema = z
  .object({
    VITE_AUTH_MODE: z.preprocess(
      (value) => (value === '' ? undefined : value),
      z.enum(AUTH_MODES).default('mock'),
    ),
    VITE_GITHUB_CLIENT_ID: optional,
    VITE_GITHUB_REDIRECT_URI: optional,
    VITE_API_BASE_URL: optional,
    VITE_GITHUB_APP_SLUG: optional.pipe(
      z
        .string()
        .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'must be a GitHub App slug (a-z, 0-9, -)')
        .optional(),
    ),
  })
  .superRefine((env, ctx) => {
    if (env.VITE_AUTH_MODE !== 'github') return
    const clientId = env.VITE_GITHUB_CLIENT_ID
    if (clientId === undefined) {
      ctx.addIssue({ code: 'custom', path: ['VITE_GITHUB_CLIENT_ID'], message: 'is required' })
    } else if (!/^[\w.-]+$/.test(clientId)) {
      ctx.addIssue({
        code: 'custom',
        path: ['VITE_GITHUB_CLIENT_ID'],
        message: 'must be a GitHub App client ID',
      })
    }
    const redirectUri = env.VITE_GITHUB_REDIRECT_URI
    if (redirectUri === undefined) {
      ctx.addIssue({ code: 'custom', path: ['VITE_GITHUB_REDIRECT_URI'], message: 'is required' })
    } else if (!isCallbackUrl(redirectUri)) {
      ctx.addIssue({
        code: 'custom',
        path: ['VITE_GITHUB_REDIRECT_URI'],
        message: `must be an absolute http(s) URL ending in ${CALLBACK_PATH}`,
      })
    }
  })

function isCallbackUrl(value: string): boolean {
  if (!URL.canParse(value)) return false
  const url = new URL(value)
  return (url.protocol === 'https:' || url.protocol === 'http:') && url.pathname === CALLBACK_PATH
}

/**
 * Validates the public build-time variables. `origin` supplies the mock-mode
 * callback URL when VITE_GITHUB_REDIRECT_URI is not set.
 */
export function parseEnv(env: Record<string, unknown>, origin: string): ConfigResult {
  const result = envSchema.safeParse(env)
  if (!result.success) {
    return {
      ok: false,
      issues: result.error.issues.map((issue) => ({
        variable: issue.path.map(String).join('.'),
        message: issue.message,
      })),
    }
  }
  const parsed = result.data
  return {
    ok: true,
    config: {
      authMode: parsed.VITE_AUTH_MODE,
      githubClientId: parsed.VITE_GITHUB_CLIENT_ID ?? null,
      githubRedirectUri: parsed.VITE_GITHUB_REDIRECT_URI ?? `${origin}${CALLBACK_PATH}`,
      apiBaseUrl: (parsed.VITE_API_BASE_URL ?? '/api').replace(/\/+$/, ''),
      githubAppInstallUrl: parsed.VITE_GITHUB_APP_SLUG
        ? `https://github.com/apps/${parsed.VITE_GITHUB_APP_SLUG}/installations/new`
        : null,
    },
  }
}

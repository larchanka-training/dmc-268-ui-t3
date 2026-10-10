import { CALLBACK_PATH } from '@/shared/config/env'

/**
 * Returns `path` when it is a same-origin path other than the callback,
 * otherwise `/`. Guards against open redirects through a tampered attempt.
 */
export function safeReturnPath(path: string, origin: string): string {
  if (!path.startsWith('/') || path.startsWith('//')) return '/'
  if (!URL.canParse(path, origin)) return '/'
  const url = new URL(path, origin)
  if (url.origin !== origin || url.pathname === CALLBACK_PATH) return '/'
  return `${url.pathname}${url.search}${url.hash}`
}

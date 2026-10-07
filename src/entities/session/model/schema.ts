import { z } from 'zod'

const nonEmpty = z.string().trim().min(1)

/** Validates a SessionWire payload (exchange and refresh responses). */
export const sessionWireSchema = z.object({
  access_token: nonEmpty,
  expires_in: z.number().int().positive(),
  user: z.object({
    id: z.number().int().positive(),
    login: nonEmpty,
    name: z.string().nullable(),
    avatar_url: z.url(),
  }),
})

export interface SessionUser {
  id: number
  login: string
  name: string | null
  avatarUrl: string
}

export interface Session {
  /** App access token; in memory only. */
  accessToken: string
  /** Epoch milliseconds, measured on this client's clock. */
  expiresAt: number
  user: SessionUser
}

/**
 * Parses a session response. Expiry is the client's receive time plus
 * `expires_in`, so clock skew between client and backend does not matter.
 */
export function parseSession(wire: unknown, receivedAt: number = Date.now()): Session {
  const parsed = sessionWireSchema.parse(wire)
  return {
    accessToken: parsed.access_token,
    expiresAt: receivedAt + parsed.expires_in * 1000,
    user: {
      id: parsed.user.id,
      login: parsed.user.login,
      name: parsed.user.name,
      avatarUrl: parsed.user.avatar_url,
    },
  }
}

import { useStore } from 'zustand'
import { createStore } from 'zustand/vanilla'
import type { Session } from './schema'

/** `restoring` lasts from page load until the first refresh settles. */
export type SessionStatus = 'restoring' | 'signed-out' | 'signed-in'

/** Why the user was signed out, when the sign-in screen should say so. */
export type SignOutReason = 'expired'

interface SessionState {
  status: SessionStatus
  /** Held in memory only: never persisted, so a reload restores through the refresh cookie. */
  session: Session | null
  reason: SignOutReason | null
  actions: {
    signIn: (session: Session) => void
    signOut: (reason?: SignOutReason) => void
    /** Test helper: back to the page-load state. */
    reset: () => void
  }
}

export const sessionStore = createStore<SessionState>()((set) => ({
  status: 'restoring',
  session: null,
  reason: null,
  actions: {
    signIn: (session) => {
      set({ status: 'signed-in', session, reason: null })
    },
    signOut: (reason) => {
      set({ status: 'signed-out', session: null, reason: reason ?? null })
    },
    reset: () => {
      set({ status: 'restoring', session: null, reason: null })
    },
  },
}))

/** Current access token for request headers, or null when signed out. */
export const getAccessToken = () => sessionStore.getState().session?.accessToken ?? null

export const useSessionStatus = () => useStore(sessionStore, (state) => state.status)

export const useSessionUser = () => useStore(sessionStore, (state) => state.session?.user ?? null)

export const useSessionExpiresAt = () =>
  useStore(sessionStore, (state) => state.session?.expiresAt ?? null)

export const useSignOutReason = () => useStore(sessionStore, (state) => state.reason)

export const useSessionActions = () => useStore(sessionStore, (state) => state.actions)

import { beforeEach, describe, expect, it } from 'vitest'
import type { Session } from './schema'
import { getAccessToken, sessionStore } from './session-store'

const session: Session = {
  accessToken: 'secret-access-token',
  expiresAt: Date.now() + 60_000,
  user: { id: 1, login: 'octocat', name: null, avatarUrl: 'https://example.com/a.png' },
}

function webStorageValues(): string[] {
  const values: string[] = []
  for (const storage of [localStorage, sessionStorage]) {
    for (let index = 0; index < storage.length; index += 1) {
      const key = storage.key(index)
      if (key !== null) values.push(key, storage.getItem(key) ?? '')
    }
  }
  return values
}

describe('sessionStore', () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
    sessionStore.getState().actions.reset()
  })

  it('starts in the restoring state', () => {
    expect(sessionStore.getState()).toMatchObject({ status: 'restoring', session: null })
    expect(getAccessToken()).toBeNull()
  })

  it('signs in and keeps the token in memory only', () => {
    sessionStore.getState().actions.signIn(session)
    expect(sessionStore.getState().status).toBe('signed-in')
    expect(getAccessToken()).toBe('secret-access-token')
    expect(webStorageValues().join('\n')).not.toContain('secret-access-token')
  })

  it('signs out, clearing the session and recording the reason', () => {
    const { actions } = sessionStore.getState()
    actions.signIn(session)
    actions.signOut('expired')
    expect(sessionStore.getState()).toMatchObject({
      status: 'signed-out',
      session: null,
      reason: 'expired',
    })
    actions.signIn(session)
    expect(sessionStore.getState().reason).toBeNull()
  })
})

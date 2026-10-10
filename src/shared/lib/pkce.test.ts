import { describe, expect, it } from 'vitest'
import { createCodeChallenge, createCodeVerifier, createState } from './pkce'

describe('pkce', () => {
  it('derives the RFC 7636 Appendix B challenge', async () => {
    await expect(createCodeChallenge('dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk')).resolves.toBe(
      'E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM',
    )
  })

  it('creates a fresh URL-safe state of 256 bits each time', () => {
    const first = createState()
    const second = createState()
    expect(first).not.toBe(second)
    // 32 bytes encode to 43 base64url characters.
    expect(first).toMatch(/^[\w-]{43}$/)
  })

  it('creates a verifier within the RFC 7636 length and alphabet', () => {
    expect(createCodeVerifier()).toMatch(/^[\w-]{43,128}$/)
  })
})

/** OAuth `state` and PKCE (RFC 7636, S256) helpers built on Web Crypto. */

function base64Url(bytes: Uint8Array): string {
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function randomToken(byteLength: number): string {
  return base64Url(crypto.getRandomValues(new Uint8Array(byteLength)))
}

/** 256 bits of randomness, URL-safe. */
export function createState(): string {
  return randomToken(32)
}

/** A 43-character code verifier (32 random bytes), within RFC 7636's 43–128 range. */
export function createCodeVerifier(): string {
  return randomToken(32)
}

/** BASE64URL(SHA-256(verifier)), the `S256` code challenge. */
export async function createCodeChallenge(verifier: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier))
  return base64Url(new Uint8Array(digest))
}

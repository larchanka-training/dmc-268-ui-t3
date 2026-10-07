/// <reference types="vite/client" />

// Public build-time variables. Everything with the VITE_ prefix ends up in the
// JS bundle, so secrets never belong here. See .env.example.
interface ImportMetaEnv {
  readonly VITE_AUTH_MODE?: string
  readonly VITE_GITHUB_CLIENT_ID?: string
  readonly VITE_GITHUB_REDIRECT_URI?: string
  readonly VITE_API_BASE_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

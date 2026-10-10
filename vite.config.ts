import { fileURLToPath, URL } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { loadEnv } from 'vite'
import { defineConfig } from 'vitest/config'

export default defineConfig(({ mode }) => {
  // Empty prefix: also reads non-public variables. API_PROXY_TARGET configures the
  // dev server only and never reaches the bundle.
  const { API_PROXY_TARGET } = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    server: API_PROXY_TARGET
      ? {
          // Same-origin /api in dev, so the backend's refresh cookie works as in production.
          proxy: { '/api': { target: API_PROXY_TARGET, changeOrigin: true } },
        }
      : undefined,
    test: {
      environment: 'jsdom',
      setupFiles: ['./src/shared/config/test-setup.ts'],
      css: false,
    },
  }
})

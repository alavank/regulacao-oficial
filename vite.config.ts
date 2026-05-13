import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const supabaseHost = env.VITE_SUPABASE_URL
    ? new URL(env.VITE_SUPABASE_URL).host.replace(/\./g, '\\.')
    : '.*\\.supabase\\.co'

  return {
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['icon.svg', 'icon-192.svg', 'icon-512.svg'],
        manifest: false,
        workbox: {
          globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-cache',
                expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
                cacheableResponse: { statuses: [0, 200] },
              },
            },
            {
              urlPattern: new RegExp(`^https://${supabaseHost}/rest/v1/.*`, 'i'),
              handler: 'NetworkFirst',
              options: {
                cacheName: 'supabase-api-cache',
                expiration: { maxEntries: 50, maxAgeSeconds: 60 * 5 },
                cacheableResponse: { statuses: [0, 200] },
                networkTimeoutSeconds: 10,
              },
            },
          ],
        },
      }),
    ],
    build: {
      outDir: 'dist',
      sourcemap: false,
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom', 'react-router-dom'],
            charts: ['recharts'],
            supabase: ['@supabase/supabase-js'],
          },
        },
      },
    },
    server: {
      port: 5173,
      proxy: {
        '/api': {
          target: 'http://localhost:3000',
          changeOrigin: true,
        },
      },
    },
  }
})

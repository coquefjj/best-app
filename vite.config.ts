import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  base: '/best-app/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.png'],
      workbox: {
        // Precache the self-hosted pixel fonts so the app keeps its look offline.
        globPatterns: ['**/*.{js,css,html,woff2,png,svg,webp}'],
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
      },
      manifest: {
        name: 'Quest — 100 Day Plan',
        short_name: 'Quest',
        description: "Fernando's 100-day hybrid athletic plan tracker",
        theme_color: '#5e9c3c',
        background_color: '#5e9c3c',
        display: 'standalone',
        start_url: '.',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
    }),
  ],
})

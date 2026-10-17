import { defineConfig, type Plugin } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'
import statusHandler from './api/status.ts'

function statusApiPlugin(): Plugin {
  return {
    name: 'sierichs-status-api',
    configureServer(server) {
      server.middlewares.use((request, response, next) => {
        if (request.url !== '/api/status') {
          next()
          return
        }

        void statusHandler(request, response)
      })
    },
    configurePreviewServer(server) {
      server.middlewares.use((request, response, next) => {
        if (request.url !== '/api/status') {
          next()
          return
        }

        void statusHandler(request, response)
      })
    },
  }
}

export default defineConfig({
  plugins: [
    statusApiPlugin(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'Sierichs Ampel',
        short_name: 'Sierichs',
        description:
          'Zeigt, ob der Biergarten Sierich im Hamburger Stadtpark geöffnet hat.',
        lang: 'de',
        id: '/',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#0b1210',
        theme_color: '#0b1210',
        icons: [
          {
            src: 'icon-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'icon-512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,svg,webmanifest}'],
        navigateFallback: '/index.html',
        cleanupOutdatedCaches: true,
      },
    }),
  ],
})

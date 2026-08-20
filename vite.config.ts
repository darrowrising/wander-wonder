import path from 'node:path'
import { fileURLToPath } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const defaultSiteUrl = 'https://wander-wonder.vercel.app'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_')
  const siteUrl = (env.VITE_SITE_URL || defaultSiteUrl).replace(/\/$/, '')

  return {
    plugins: [
      {
        name: 'html-site-url',
        transformIndexHtml(html) {
          return html.replaceAll('%SITE_URL%', siteUrl)
        },
      },
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        injectRegister: false,
        includeAssets: ['apple-touch-icon.png', 'logo.png', 'logo-mark.png', 'og.png', 'pwa-192.png', 'pwa-512.png'],
        manifest: {
          name: 'Wander Wonder',
          short_name: 'Wander Wonder',
          description: 'Play where you are. Family adventure games for the road.',
          theme_color: '#1d4e3b',
          background_color: '#f7f3ee',
          display: 'standalone',
          start_url: '/',
          lang: 'en',
          icons: [
            { src: 'pwa-192.png', sizes: '192x192', type: 'image/png' },
            { src: 'pwa-512.png', sizes: '512x512', type: 'image/png' },
          ],
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
          navigateFallback: 'index.html',
        },
      }),
    ],
    server: {
      port: 7024,
      strictPort: true,
    },
    preview: {
      port: 7024,
      strictPort: true,
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
  }
})

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: 'GitHub Issues Chat',
        short_name: 'GH Chat',
        description: 'GitHub Issues를 활용한 실시간 채팅',
        theme_color: '#0366d6',
        background_color: '#ffffff',
        display: 'standalone',
        icons: [
          {
            src: 'img/png/icon48.png',
            sizes: '48x48',
            type: 'image/png'
          },
          {
            src: 'img/png/icon72.png',
            sizes: '72x72',
            type: 'image/png'
          },
          {
            src: 'img/png/icon96.png',
            sizes: '96x96',
            type: 'image/png'
          },
          {
            src: 'img/png/icon144.png',
            sizes: '144x144',
            type: 'image/png'
          },
          {
            src: 'img/png/icon192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'img/png/appstore1024.png',
            sizes: '1024x1024',
            type: 'image/png'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}']
      }
    })
  ],
  // GitHub Pages를 위한 base URL 설정
  base: '/Github_Issues_Chat/',
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: undefined,
      }
    }
  }
})
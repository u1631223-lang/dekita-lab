import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: './', // ✅ ← 相対パス指定（Vercel環境で必須）
  build: {
    outDir: 'dist', // ✅ ← front/dist に出力
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['favicon.svg'],
      minify: false,
      workbox: {
        mode: 'development'
      },
      manifest: {
        name: 'Dekita Lab',
        short_name: 'Dekita',
        description: 'Neuroscience-inspired learning games for kids.',
        theme_color: '#ff7b54',
        background_color: '#fff7f0',
        display: 'standalone',
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' }
        ]
      }
    })
  ],
  server: {
    port: 5173
  },
  resolve: {
    alias: {
      '@app': '/src/app',
      '@core': '/src/core',
      '@modules': '/src/modules',
      '@ui': '/src/ui',
      '@state': '/src/core/state'
    }
  }
});

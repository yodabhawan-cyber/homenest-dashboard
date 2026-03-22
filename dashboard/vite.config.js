import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3100,
    host: true,
    fs: {
      // Allow serving files from parent directory (config folder)
      allow: ['..']
    },
    proxy: {
      '/api/setup': {
        target: 'http://localhost:3201',
        changeOrigin: true
      },
      '/api/settings': {
        target: 'http://localhost:3201',
        changeOrigin: true
      }
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@config': path.resolve(__dirname, '../config')
    }
  },
  publicDir: 'public'
})

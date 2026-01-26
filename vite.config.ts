import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
  },
  build: {
    target: 'esnext',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            return 'vendor'
          }
          if (id.includes('/src/engine/')) {
            return 'engine'
          }
          if (id.includes('/src/components/NodeEditor/')) {
            return 'node-editor'
          }
          if (id.includes('/src/components/NewGameScreen/')) {
            return 'new-game'
          }
          if (id.includes('/src/components/GameCanvas/')) {
            return 'canvas'
          }
          return undefined
        }
      }
    }
  },
})

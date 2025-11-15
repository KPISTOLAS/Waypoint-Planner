import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
  },
  base: './',
  optimizeDeps: {
    include: ['leaflet', 'react', 'react-dom', 'react/jsx-runtime'],
    exclude: ['leaflet-draw'],
    force: true, // Force re-optimization (remove this after first successful build)
  },
  build: {
    commonjsOptions: {
      include: [/leaflet-draw/, /node_modules/],
    },
  },
})


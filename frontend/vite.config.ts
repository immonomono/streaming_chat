import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: '0.0.0.0',
    port: 20012,
    proxy: {
      '/auth': 'http://localhost:8001',
      '/conversations': 'http://localhost:8001',
      '/chat': 'http://localhost:8001',
    },
  },
})

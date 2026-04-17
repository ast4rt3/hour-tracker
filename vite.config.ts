import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/hour-tracker/',
  plugins: [react()],
  server: {
    host: 'localhost',
    port: 5173,
  },
})
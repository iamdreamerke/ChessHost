import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// VITE_BASE is set by the GitHub Pages workflow (e.g. /ChessHost/). Locally it stays '/'.
export default defineConfig({
  base: process.env.VITE_BASE || '/',
  plugins: [react()],
  server: { host: true },
})

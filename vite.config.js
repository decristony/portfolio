import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  // "/" na Vercel; o build do GitHub Pages usa VITE_BASE=/portfolio/
  base: process.env.VITE_BASE || '/',
  plugins: [
    tailwindcss(),
    react(),
  ],
})

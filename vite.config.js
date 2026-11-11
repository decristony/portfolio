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
  build: {
    // o único chunk acima de 500 kB é o three.js (~190 kB gzip), que já vem
    // sob demanda (só com o túnel 3D), fora do pacote inicial
    chunkSizeWarningLimit: 800,
  },
})

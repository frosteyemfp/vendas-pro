import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite' // Nova linha importada

// https://vite.dev
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(), // Nova linha adicionada aqui
  ],
})

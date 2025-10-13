// File: vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist', // output folder build
    sourcemap: false, // nonaktifkan sourcemap untuk build lebih ringan
    rollupOptions: {
      output: {
        manualChunks: undefined, // cegah split otomatis agar file build simple
      },
    },
  },
  server: {
    port: 5173, // port lokal
    open: true, // auto buka browser saat 'npm run dev'
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'), // arahkan alias ke folder src
    },
  },
})

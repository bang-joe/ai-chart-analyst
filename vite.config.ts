// File: vite.config.ts (VERSI BARU UNTUK VERCEL)
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: { manualChunks: undefined },
    },
  },
  server: {
    port: 5173,
    open: true,
    // Kita hapus bagian proxy di sini! Vercel menanganinya secara otomatis.
  },
  // Kita hapus 'base' agar routing di Vercel sempurna.
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
});
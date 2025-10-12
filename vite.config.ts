// File: vite.config.ts (SOLUSI VITE MURNI & SIMPEL)
import { defineConfig } from 'vite'; 
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  // Vite secara default memuat variabel yang diawali VITE_
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
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
});
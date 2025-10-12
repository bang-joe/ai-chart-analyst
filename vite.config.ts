// File: vite.config.ts (FINAL FIX UNTUK MENDUKUNG NEXT_PUBLIC_ DENGAN VITE)
import { defineConfig, loadEnv } from 'vite'; // <<< TAMBAHKAN loadEnv
import react from '@vitejs/plugin-react';
import path from 'path';

// Export sebagai fungsi agar kita bisa mendapatkan mode (development/production)
export default defineConfig(({ mode }) => {
  // 1. Muat semua variabel lingkungan dari file .env (dan Vercel)
  const env = loadEnv(mode, process.cwd(), '');

  // 2. Siapkan objek envClient yang hanya berisi variabel yang dibutuhkan klien
  // Ini akan mengambil semua yang diawali dengan 'NEXT_PUBLIC_'
  const envClient = Object.keys(env)
    .filter(key => key.startsWith('NEXT_PUBLIC_') || key.startsWith('VITE_'))
    .reduce((acc, key) => {
      // Menyuntikkan variabel dengan format process.env.VAR_NAME
      acc[`process.env.${key}`] = JSON.stringify(env[key]);
      return acc;
    }, {});

  return {
    plugins: [react()],
    // PERBAIKAN KRUSIAL: Tambahkan 'define' untuk menyuntikkan variabel ke kode frontend
    define: {
      ...envClient,
    },
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
  };
});
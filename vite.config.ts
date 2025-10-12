// File: vite.config.ts (VERSI FINAL UNTUK MENDUKUNG ENV VERCEL/NEXT_PUBLIC_)
import { defineConfig, loadEnv } from 'vite'; 
import react from '@vitejs/plugin-react';
import path from 'path';

// Eksport sebagai fungsi agar kita bisa mendapatkan mode (development/production)
export default defineConfig(({ mode }) => {
  // 1. Muat semua variabel lingkungan dari file .env (dan Vercel)
  // Ini penting agar Vite tahu ada variabel lingkungan
  const env = loadEnv(mode, process.cwd(), '');

  // 2. Siapkan objek envClient yang hanya berisi variabel yang dibutuhkan klien
  const envClient = Object.keys(env)
    .filter(key => key.startsWith('NEXT_PUBLIC_') || key.startsWith('VITE_'))
    .reduce((acc, key) => {
      // Menyuntikkan variabel dengan format process.env.VAR_NAME agar konsisten dengan kode Anda
      acc[`process.env.${key}`] = JSON.stringify(env[key]);
      return acc;
    }, {});

  return {
    plugins: [react()],
    // PERBAIKAN UTAMA: Tambahkan 'define' untuk menyuntikkan variabel ke kode frontend
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
      // Hapus proxy, Vercel menanganinya
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './'),
      },
    },
  };
});
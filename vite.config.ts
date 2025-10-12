// File: vite.config.ts (VERSI FINAL UNTUK MENDUKUNG ENV VERCEL/NEXT_PUBLIC_)
import { defineConfig, loadEnv } from 'vite'; // <<< TAMBAHKAN loadEnv
import react from '@vitejs/plugin-react';
import path from 'path';

// Eksport sebagai fungsi agar kita bisa mendapatkan mode (development/production)
export default defineConfig(({ mode }) => {
  // 1. Muat semua variabel lingkungan dari file .env (dan Vercel)
  // Vite akan memuatnya ke process.env
  const env = loadEnv(mode, process.cwd(), '');

  // 2. Siapkan objek envClient yang hanya berisi variabel yang dibutuhkan klien
  // Kita akan mengambil semua yang diawali dengan 'NEXT_PUBLIC_' dan 'VITE_'
  const envClient = Object.keys(env)
    .filter(key => key.startsWith('NEXT_PUBLIC_') || key.startsWith('VITE_'))
    .reduce((acc, key) => {
      // Pastikan nilai dikonversi menjadi string agar dapat di-replace oleh Vite
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
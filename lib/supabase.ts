// ✅ supabase.ts — versi fix (gunakan anon key agar INSERT ke testimonials berhasil)

import { createClient } from "@supabase/supabase-js";

// Coba baca env versi Vite dulu (kalau project pakai Vite)
const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;

const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_ANON_KEY;

// Tambahkan sedikit proteksi agar gak blank
if (!supabaseUrl || !supabaseAnonKey) {
  console.error("❌ Supabase env vars not found. Check your Vercel environment!");
}

// ✅ Buat koneksi aman menggunakan anon key (frontend-safe)
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: true,
  },
});

// Optional: log koneksi sukses
console.log("✅ Supabase client initialized with anon key");

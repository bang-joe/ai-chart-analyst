// File: utils/supabase-client.ts (FINAL PRODUCTION SAFE VERSION)

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// 🧩 Variabel lingkungan dari Vite
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// ✅ Gunakan Singleton agar tidak inisialisasi ulang setiap kali file diimpor
let supabaseClient: SupabaseClient | null = null;

/**
 * Inisialisasi Supabase Client hanya sekali
 */
function initSupabase(): SupabaseClient {
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("❌ Supabase env vars (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY) hilang!");
    throw new Error("Missing Supabase credentials. Pastikan .env sudah benar.");
  }

  if (!supabaseClient) {
    supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        detectSessionInUrl: true,
      },
    });
    console.log("✅ Supabase client initialized.");
  }

  return supabaseClient;
}

/**
 * Helper universal untuk akses instance Supabase yang aman
 */
export const getSupabase = (): SupabaseClient => {
  return initSupabase();
};

// ✅ Export default instance agar kompatibel dengan semua import lama
export const supabase = getSupabase();

// Alias opsional untuk backward compatibility
export const client = supabase;
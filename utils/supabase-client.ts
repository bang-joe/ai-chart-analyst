// File: utils/supabase-client.ts (FINAL PRODUCTION-READY VERSION)
// 💡 Versi ini aman, stabil, dan auto-sync antar halaman & komponen

import { createClient, SupabaseClient } from "@supabase/supabase-js";

// 🔐 Ambil environment variable dari Vercel
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL!;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY!;

// 🧱 Singleton Supabase Client biar gak reinit setiap render
let supabase: SupabaseClient | null = null;

/**
 * Inisialisasi Supabase hanya sekali.
 * Menjamin session sinkron antar komponen (Login, AdminPanel, dsb)
 */
function initSupabase(): SupabaseClient {
  if (supabase) return supabase;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("❌ Supabase credentials missing in environment variables.");
    throw new Error("Missing Supabase credentials. Check Vercel environment settings.");
  }

  supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storageKey: "sb-tradersxauusd-auth", // ⚙️ gunakan key unik biar session gak bentrok
    },
    global: {
      fetch: async (url, options) => {
        // Tambahan proteksi agar fetch error lebih mudah dideteksi
        const res = await fetch(url, options);
        if (!res.ok) console.warn("🌐 Supabase fetch warning:", res.status, url);
        return res;
      },
    },
  });

  console.log("✅ Supabase client initialized (shared instance).");
  return supabase;
}

/**
 * Helper universal agar semua file pakai instance sama
 */
export const getSupabase = (): SupabaseClient => initSupabase();

/**
 * Default export (untuk import cepat)
 * Gunakan: import { supabase } from "../utils/supabase-client";
 */
export const supabaseClient = getSupabase();
export { supabaseClient as supabase };

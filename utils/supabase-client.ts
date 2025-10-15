// File: utils/supabase-client.ts (FINAL SAFE + AUTO REFRESH SESSION)

import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL!;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("❌ Missing Supabase environment variables!");
  throw new Error("Missing Supabase credentials.");
}

// Gunakan Singleton biar gak double client
let client: SupabaseClient | null = null;

export const supabase = (() => {
  if (!client) {
    client = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
    console.log("✅ Supabase client initialized successfully.");
  }
  return client;
})();

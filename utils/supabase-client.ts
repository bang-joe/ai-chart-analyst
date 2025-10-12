// File: utils/supabase-client.ts (FINAL DENGAN KONVENSI VITE MUTLAK)

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// PERUBAHAN: Menggunakan import.meta.env
const supabaseUrl = import.meta.env.NEXT_PUBLIC_SUPABASE_URL; // Gunakan import.meta.env
const supabaseAnonKey = import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY; // Gunakan import.meta.env

let supabaseClient: SupabaseClient | null = null;

if (supabaseUrl && supabaseAnonKey) {
    supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
} else {
    // Kita biarkan ini sebagai warning yang aman
    console.warn("⚠️ SUPABASE CLIENT FAILURE: NEXT_PUBLIC_ variables missing from Vite build.");
}
export const client = supabaseClient;
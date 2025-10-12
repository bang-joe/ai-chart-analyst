// File: utils/supabase-client.ts (FINAL DENGAN KONVENSI VITE MURNI)

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// PERUBAHAN: Menggunakan konvensi VITE_ yang dijamin berfungsi
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

let supabaseClient: SupabaseClient | null = null;

if (supabaseUrl && supabaseAnonKey) {
    supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
} else {
    console.warn("⚠️ SUPABASE CLIENT FAILURE: VITE_ variables missing from Vite build.");
}
export const client = supabaseClient;
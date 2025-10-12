// File: utils/supabase-client.ts (FINAL FIX CLIENT)

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Menggunakan variabel NEXT_PUBLIC_ yang baru saja kita tambahkan di Vercel
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

let supabaseClient: SupabaseClient | null = null;

if (supabaseUrl && supabaseAnonKey) {
    supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
} else {
    // Ini akan menampilkan error jika Anda belum menambahkan NEXT_PUBLIC_ di Vercel
    console.warn("⚠️ SUPABASE CLIENT FAILURE: NEXT_PUBLIC_ variables missing.");
}

export const client = supabaseClient;
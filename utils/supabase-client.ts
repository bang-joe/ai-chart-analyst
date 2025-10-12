// File: utils/supabase-client.ts (FINAL FIX)

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Variabel ini harus menggunakan prefiks NEXT_PUBLIC_ agar dapat dibaca oleh klien (browser)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

let supabaseClient: SupabaseClient | null = null;

// HANYA inisialisasi jika variabel lingkungan tersedia
// Ini akan mencegah error langsung jika Vite masih gagal dalam development
if (supabaseUrl && supabaseAnonKey) {
    supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
} else {
    // Ini hanya log peringatan, bukan error yang membuat blank screen
    console.warn("⚠️ Supabase Client Gagal Inisialisasi: NEXT_PUBLIC_ variabels hilang di build. Periksa vite.config.ts.");
}

// Ekspor klien Supabase
export const client = supabaseClient;
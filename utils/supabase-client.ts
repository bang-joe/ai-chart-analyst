// File: utils/supabase-client.ts (HARUS DIBUAT)

import { createClient } from '@supabase/supabase-js';

// Variabel ini harus menggunakan prefiks NEXT_PUBLIC_ agar dapat dibaca oleh klien (browser)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// PENTING: Periksa keberadaan variabel
if (!supabaseUrl || !supabaseAnonKey) {
  // Ini akan menghasilkan error yang Anda lihat jika variabel di Vercel belum benar!
  throw new Error("Variabel lingkungan NEXT_PUBLIC_SUPABASE_URL atau NEXT_PUBLIC_SUPABASE_ANON_KEY hilang.");
}

// Ekspor klien Supabase untuk digunakan di semua komponen React/TSX
export const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);

// Catatan: Jika Anda tidak menggunakan Supabase Client di frontend, Anda bisa hapus file ini 
// DAN hapus semua import 'supabaseClient' di komponen frontend Anda.
// File: api/auth.ts (BACKEND BARU UNTUK VERCELL)

import { createClient } from '@supabase/supabase-js';
import type { VercelRequest, VercelResponse } from '@vercel/node';

// Buat koneksi ke Supabase menggunakan kunci dari brankas Vercel
const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_ANON_KEY!
);

export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
  if (request.method !== 'POST') {
    return response.status(405).json({ message: 'Method Not Allowed' });
  }

  const { email, activationCode } = request.body;

  if (!email || !activationCode) {
    return response.status(400).json({ message: 'Email dan Kode Aktivasi dibutuhkan.' });
  }

  try {
    // 1. CARI USER DI DATABASE SUPABASE
    const { data: user, error } = await supabase
      .from('members') // Nama tabel kita
      .select('*') // Ambil semua data user
      .eq('email', email)
      .single(); // Cari satu user saja

    if (error || !user) {
      throw new Error("Email atau Kode Aktivasi salah.");
    }

    // 2. VERIFIKASI KODE AKTIVASI, STATUS, DAN MASA AKTIF
    if (user.activation_code !== activationCode) {
      throw new Error("Email atau Kode Aktivasi salah.");
    }

    if (!user.is_active) {
      throw new Error("Akun belum aktif. Hubungi admin.");
    }

    if (user.membership_expires_at && new Date(user.membership_expires_at) < new Date()) {
      throw new Error("Masa aktif akun telah habis.");
    }

    // 3. UPDATE WAKTU LOGIN TERAKHIR (jika berhasil)
    await supabase
      .from('members')
      .update({ last_login: new Date().toISOString() })
      .eq('id', user.id);
    
    // 4. KIRIM DATA USER KEMBALI KE FRONTEND
    return response.status(200).json({ message: 'Login berhasil!', user });

  } catch (error: any) {
    return response.status(401).json({ message: error.message || 'Otentikasi gagal.' });
  }
}
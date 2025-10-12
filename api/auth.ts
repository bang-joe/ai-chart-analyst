// File: api/auth.ts (VERSI PERBAIKAN FINAL & AMAN)

import { createClient } from '@supabase/supabase-js';
import type { VercelRequest, VercelResponse } from '@vercel/node';

// PERBAIKAN UTAMA: Menggunakan SUPABASE_SERVICE_ROLE_KEY untuk akses database yang aman.
// Pastikan SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY tersedia di Vercel (tanpa NEXT_PUBLIC_).
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! 
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
    const { data: user, error } = await supabase
      .from('members')
      .select('*')
      .eq('email', email)
      .single();

    if (error || !user) {
      // Jika error, cek log Supabase/Vercel. User hanya melihat pesan umum.
      throw new Error("Email atau Kode Aktivasi salah.");
    }

    // Periksa kode aktivasi
    if (user.activation_code !== activationCode) {
      throw new Error("Email atau Kode Aktivasi salah.");
    }

    if (!user.is_active) {
      throw new Error("Akun belum aktif. Hubungi admin.");
    }

    if (user.membership_expires_at && new Date(user.membership_expires_at) < new Date()) {
      throw new Error("Masa aktif akun telah habis.");
    }

    // Update last_login
    await supabase
      .from('members')
      .update({ last_login: new Date().toISOString() })
      .eq('id', user.id);
    
    return response.status(200).json({ message: 'Login berhasil!', user });

  } catch (error: any) {
    // Tambahkan log di server untuk debugging
    console.error('[API AUTH ERROR]:', error.message || error);
    // Kembalikan error yang lebih umum jika ini adalah error server internal
    const errorMessage = error.message.includes('A server error') ? 'Gagal terhubung ke server. Coba lagi.' : error.message;
    return response.status(401).json({ message: errorMessage || 'Otentikasi gagal.' });
  }
}
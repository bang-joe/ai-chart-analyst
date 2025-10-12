// File: api/auth.ts (VERSI PERBAIKAN FINAL)

import { createClient } from '@supabase/supabase-js';
import type { VercelRequest, VercelResponse } from '@vercel/node';

// PERBAIKAN: Gunakan nama variabel TANPA awalan VITE_ untuk backend
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
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
      throw new Error("Email atau Kode Aktivasi salah.");
    }

    // Ganti 'activation_code' menjadi 'activation_cc' jika nama kolom di databasemu begitu
    if (user.activation_code !== activationCode) {
      throw new Error("Email atau Kode Aktivasi salah.");
    }

    if (!user.is_active) {
      throw new Error("Akun belum aktif. Hubungi admin.");
    }

    if (user.membership_expires_at && new Date(user.membership_expires_at) < new Date()) {
      throw new Error("Masa aktif akun telah habis.");
    }

    await supabase
      .from('members')
      .update({ last_login: new Date().toISOString() })
      .eq('id', user.id);
    
    return response.status(200).json({ message: 'Login berhasil!', user });

  } catch (error: any) {
    // Tambahkan log di server untuk debugging
    console.error('[API AUTH ERROR]:', error);
    return response.status(401).json({ message: error.message || 'Otentikasi gagal.' });
  }
}
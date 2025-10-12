// File: api/auth.ts (FINAL PRODUCTION READY)
import { createClient } from '@supabase/supabase-js';
import type { VercelRequest, VercelResponse } from '@vercel/node';

// ⚙️ Buat koneksi Supabase menggunakan Service Role Key (AMAN untuk backend)
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ✅ Tipe data User sesuai tabel Supabase
interface Member {
  id: number;
  uid?: string;
  name: string;
  email: string;
  activation_code: string;
  is_admin: boolean;
  is_active: boolean;
  membership_type: string;
  plan_type: string;
  join_date: string;
  membership_expires_at: string | null;
  last_login?: string;
  picture_url?: string;
}

export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
  if (request.method !== 'POST') {
    return response.status(405).json({ message: 'Method Not Allowed' });
  }

  // ✳️ Bersihkan input
  const email = (request.body.email || '').trim().toLowerCase();
  const activationCode = (request.body.activationCode || '').trim();

  if (!email || !activationCode) {
    return response.status(400).json({ message: 'Email dan Kode Aktivasi dibutuhkan.' });
  }

  try {
    // 1️⃣ Cari user berdasarkan email
    const { data: user, error } = await supabase
      .from('members')
      .select('*')
      .eq('email', email)
      .single();

    if (error || !user) {
      throw new Error("Email atau Kode Aktivasi salah.");
    }

    // 2️⃣ Validasi kode dan status aktif
    if (user.activation_code !== activationCode) {
      throw new Error("Email atau Kode Aktivasi salah.");
    }

    if (!user.is_active) {
      throw new Error("Akun belum aktif. Hubungi admin.");
    }

    // 3️⃣ Cek masa aktif
    if (user.membership_expires_at && new Date(user.membership_expires_at) < new Date()) {
      throw new Error("Masa aktif akun telah habis.");
    }

    // 4️⃣ Update last_login di database
    await supabase
      .from('members')
      .update({ last_login: new Date().toISOString() })
      .eq('id', user.id);

    // 5️⃣ Siapkan response aman untuk frontend
    const safeUser = {
      uid: user.uid || user.id.toString(),
      name: user.name || '',
      email: user.email,
      code: user.activation_code,
      isAdmin:
        user.is_admin ||
        user.email === "joeuma929@gmail.com" || // fallback superadmin
        user.plan_type === "ADMIN",
      isActive: user.is_active,
      membership: user.membership_type,
      planType: user.plan_type,
      joinDate: user.join_date,
      expDate: user.membership_expires_at,
      lastLogin: user.last_login || null,
      picture: user.picture_url || null,
    };

    // ✅ Berhasil login
    return response.status(200).json({ message: 'Login berhasil!', user: safeUser });

  } catch (error: any) {
    console.error('[API AUTH ERROR]:', error.message || error);

    const errorMessage =
      error.message?.includes('A server error') || error.message?.includes('fetch')
        ? 'Gagal terhubung ke server. Coba lagi.'
        : error.message;

    return response.status(401).json({
      message: errorMessage || 'Otentikasi gagal.',
    });
  }
}

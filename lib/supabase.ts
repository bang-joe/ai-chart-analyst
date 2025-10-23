import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL!;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY!;

// ✅ Inisialisasi Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ✅ Ambil semua testimoni (public bisa baca)
export async function getTestimonials() {
  const { data, error } = await supabase
    .from("testimonials")
    .select("author, text, rating, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("❌ Gagal ambil testimoni:", error.message);
    throw error;
  }

  return data || [];
}

// ✅ Subscribe realtime ke testimoni baru
export function subscribeTestimonials(callback: () => void) {
  const channel = supabase
    .channel("public:testimonials")
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "testimonials" },
      () => callback()
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

// ✅ Kirim testimoni baru (validasi: hanya 1 per user)
export async function insertTestimonial(newTesti: {
  email: string;
  message: string;
  rating: number;
}) {
  // 🧩 Cek apakah user sudah pernah kirim
  const { data: existing, error: checkError } = await supabase
    .from("testimonials")
    .select("id")
    .eq("author", newTesti.email)
    .limit(1);

  if (checkError) {
    console.error("❌ Gagal cek testimoni lama:", checkError.message);
    throw checkError;
  }

  if (existing && existing.length > 0) {
    throw new Error("Kamu sudah pernah kirim testimoni, Bro 😎");
  }

  // 🧩 Kalau belum ada, insert baru
  const { data, error } = await supabase.from("testimonials").insert([
    {
      author: newTesti.email, // 🟢 sesuai kolom DB
      text: newTesti.message, // 🟢 sesuai kolom DB
      rating: newTesti.rating,
    },
  ]);

  if (error) {
    console.error("❌ Gagal kirim testimoni:", error.message);
    throw error;
  }

  return data;
}

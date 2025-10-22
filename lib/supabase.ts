import { createClient } from "@supabase/supabase-js";

// langsung ambil dari environment (semua sudah diset di Vercel)
const supabaseUrl =
  process.env.SUPABASE_URL ||
  process.env.VITE_SUPABASE_URL ||
  "";
const supabaseAnonKey =
  process.env.SUPABASE_ANON_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  "";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ambil semua testimoni
export async function getTestimonials() {
  const { data, error } = await supabase
    .from("testimonials")
    .select("id, author, text, rating, created_at")
    .order("created_at", { ascending: false });
  if (error) {
    console.error("getTestimonials error:", error);
    return [];
  }
  return data ?? [];
}

// kirim testimoni (user login saja)
export async function addTestimonial(user: any, text: string, rating: number) {
  if (!user) throw new Error("User belum login.");
  if (!text.trim()) throw new Error("Isi testimoni wajib diisi.");
  if (rating < 1 || rating > 5) throw new Error("Rating harus antara 1–5.");

  const { error } = await supabase.from("testimonials").insert([
    { author: user.email, text, rating },
  ]);
  if (error) throw new Error(error.message);
  return true;
}

// realtime listener
export function subscribeTestimonials(onNew: (data: any) => void) {
  const channel = supabase
    .channel("realtime-testimonials")
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "testimonials" },
      (payload) => onNew(payload.new)
    )
    .subscribe();

  return () => supabase.removeChannel(channel);
}

import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL ||
  process.env.VITE_SUPABASE_URL ||
  process.env.SUPABASE_URL;

const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: true,
  },
});

// ✅ Ambil semua testimonial (public)
export async function getTestimonials() {
  const { data, error } = await supabase
    .from("testimonials")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("❌ Error getTestimonials:", error.message);
    return [];
  }

  return data || [];
}

// ✅ Subscribe realtime update
export function subscribeTestimonials(callback: (payload: any) => void) {
  const channel = supabase
    .channel("realtime-testimonials")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "testimonials" },
      (payload) => callback(payload)
    )
    .subscribe();

  // ✅ kembalikan fungsi unsubscribe (bukan objek)
  return () => {
    supabase.removeChannel(channel);
  };
}

// ✅ Kirim testimonial baru
export async function insertTestimonial(newTesti: {
  email: string;
  message: string;
  rating: number;
}) {
  const { data, error } = await supabase.from("testimonials").insert([newTesti]);

  if (error) {
    console.error("❌ Gagal kirim testimoni:", error.message);
    throw error;
  }

  return data;
}

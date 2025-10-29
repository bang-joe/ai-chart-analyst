import { createClient, RealtimeChannel } from "@supabase/supabase-js";

// Inisialisasi Supabase client (pakai anon key)
export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL as string,
  import.meta.env.VITE_SUPABASE_ANON_KEY as string
);

// =======================
// 💬 1️⃣ Insert Testimonial
// =======================
export async function insertTestimonial({
  email,
  message,
  rating,
}: {
  email: string;
  message: string;
  rating: number;
}) {
  if (!email || !message.trim()) {
    throw new Error("Email dan pesan wajib diisi");
  }

  const { data, error } = await supabase
    .from("testimonials")
    .insert([{ author: email, message, rating }]);

  if (error) {
    console.error("❌ Gagal kirim testimoni:", error.message);
    throw new Error(error.message);
  }

  return data;
}

// =======================
// 📖 2️⃣ Get Testimonials (for public display)
// =======================
export async function getTestimonials() {
  const { data, error } = await supabase
    .from("testimonials")
    .select("*")
    .order("id", { ascending: false });

  if (error) {
    console.error("❌ Gagal mengambil testimoni:", error.message);
    throw new Error(error.message);
  }

  return data;
}

// =======================
// 🔄 3️⃣ Subscribe Realtime Testimonials (Supabase Realtime)
// =======================
export function subscribeTestimonials(
  callback: (data: Record<string, any>) => void
): () => void {
  const channel: RealtimeChannel = supabase
    .channel("testimonials_changes")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "testimonials" },
      (payload) => {
        callback(payload.new);
      }
    )
    .subscribe();

  // ✅ Return fungsi cleanup agar cocok dengan useEffect React
  return () => {
    supabase.removeChannel(channel);
  };
}

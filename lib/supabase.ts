// File: lib/supabase.ts
import { createClient } from "@supabase/supabase-js";

// 🔧 Aman di browser & server
const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

// 🧩 Error handling agar build Vercel gak blank
if (!supabaseUrl || !supabaseAnonKey) {
  console.error("❌ Missing Supabase credentials", {
    supabaseUrl,
    supabaseAnonKey: supabaseAnonKey ? "present" : "missing",
  });
  throw new Error(
    "Missing Supabase credentials. Please check VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in environment variables."
  );
}

// ✅ Client khusus untuk Testimonial Realtime
export const supabaseTestimonials = createClient(supabaseUrl, supabaseAnonKey);

// --- TESTIMONIAL FUNCTIONS ---

// 🔹 Fetch semua testimoni (urut terbaru)
export const getTestimonials = async () => {
  const { data, error } = await supabaseTestimonials
    .from("testimonials")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("⚠️ Error fetching testimonials:", error.message);
    return [];
  }
  return data || [];
};

// 🔹 Subscribe realtime testimoni baru
export const subscribeTestimonials = (callback: (data: any) => void) => {
  const channel = supabaseTestimonials
    .channel("realtime:testimonials")
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "testimonials" },
      (payload) => {
        callback(payload.new);
      }
    )
    .subscribe();

  return () => {
    supabaseTestimonials.removeChannel(channel);
  };
};

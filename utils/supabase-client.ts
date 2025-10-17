import { createClient } from "@supabase/supabase-js";

// ✅ Ambil dari environment server (Vercel)
const supabaseUrl =
  process.env.SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "";

const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  "";

if (!supabaseUrl) {
  console.error("❌ Missing Supabase URL in environment variables");
  throw new Error("Missing Supabase URL");
}

if (!supabaseKey) {
  console.error("❌ Missing Supabase Key in environment variables");
  throw new Error("Missing Supabase Key");
}

export const supabase = createClient(supabaseUrl, supabaseKey);

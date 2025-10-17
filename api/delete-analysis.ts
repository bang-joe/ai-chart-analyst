// File: /api/delete-analysis.ts
import path from "path";
import { createClient } from "@supabase/supabase-js";

// Aman buat semua environment (Next, Vercel, Node)
const supabaseUrl =
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "";
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || "";

export const supabase = createClient(supabaseUrl, supabaseKey);


export default async function handler(req: any, res: any) {
  try {
    const { id } = req.query;
    if (!id) return res.status(400).json({ error: "Missing ID parameter" });

    const { error } = await supabase.from("analyses").delete().eq("id", id);
    if (error) throw error;

    return res.status(200).json({ message: "Deleted successfully" });
  } catch (err) {
    console.error("❌ Delete error:", err);
    return res.status(500).json({ error: "Failed to delete analysis." });
  }
}

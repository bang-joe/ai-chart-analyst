// File: /api/get-analyses.ts
import { supabase } from "../utils/supabase-client";

// Handler fungsi untuk mengambil data analisa user
export default async function handler(req: any, res: any) {
  try {
    // Ambil parameter user_uid dari query (misal: /api/get-analyses?user_uid=xxxx)
    const { user_uid } = req.query;

    if (!user_uid) {
      return res.status(400).json({ error: "Missing user_uid parameter" });
    }

    // Ambil data dari tabel analyses
    const { data, error } = await supabase
      .from("analyses")
      .select("*")
      .eq("user_uid", user_uid)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Supabase error:", error);
      throw error;
    }

    // Kirim hasil ke client
    return res.status(200).json({ analyses: data });
  } catch (err) {
    console.error("❌ Failed to fetch analyses:", err);
    return res.status(500).json({ error: "Failed to fetch analyses." });
  }
}

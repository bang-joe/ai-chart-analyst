// File: /api/get-analyses.ts
import { supabase } from "../utils/supabase-client";

export const config = {
  runtime: "nodejs",
};

export default async function handler(req: any, res: any) {
  try {
    const user_uid = req.query.user_uid || req.body?.user_uid;
    console.log("✅ get-analyses called");
    console.log("user_uid:", user_uid);

    if (!user_uid) {
      console.error("❌ Missing user_uid in request.");
      return res.status(400).json({ error: "Missing user_uid parameter" });
    }

    // Ambil data dari tabel analyses
    const { data, error } = await supabase
      .from("analyses")
      .select("*")
      .eq("user_uid", user_uid)
      .order("created_at", { ascending: false });

    console.log("🧩 Query result:", data);
    console.log("🧱 Query error:", error);

    if (error) {
      console.error("❌ Supabase query failed:", error);
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({ analyses: data || [] });
  } catch (err: any) {
    console.error("🔥 Function crashed:", err);
    return res.status(500).json({
      error: err.message || "Unknown error in get-analyses",
    });
  }
}

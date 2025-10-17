// File: /api/delete-analysis.ts
import { supabase } from "../utils/supabase-client";

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

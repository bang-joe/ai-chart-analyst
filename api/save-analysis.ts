import { supabase } from "../utils/supabase-client";

export const config = {
  runtime: "nodejs",
};

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const body =
      typeof req.json === "function" ? await req.json() : req.body || {};
    const { user_uid, pair, timeframe, risk, ai_text, parsed_json } = body;

    if (!user_uid || !pair || !timeframe || !risk || !ai_text) {
      return res.status(400).json({ error: "Missing required fields." });
    }

    // Simpan ke tabel analyses
    const { data, error } = await supabase.from("analyses").insert([
      {
        user_uid,
        pair,
        timeframe,
        risk,
        ai_text,
        parsed_json,
      },
    ]);

    if (error) throw error;

    return res.status(200).json({ message: "Saved successfully", data });
  } catch (err) {
    console.error("❌ Save error:", err);
    return res.status(500).json({ error: "Failed to save analysis." });
  }
}

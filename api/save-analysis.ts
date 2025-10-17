import { createClient } from "@supabase/supabase-js";

export const config = {
  runtime: "nodejs",
};

// ✅ Inisialisasi Supabase (pakai service role biar aman)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const body =
      typeof req.json === "function" ? await req.json() : req.body || {};
    const { user_uid, pair, timeframe, risk, ai_text, parsed_json } = body;

    // Validasi input
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
        parsed_json: parsed_json || {},
      },
    ]);

    if (error) throw error;

    console.log(`✅ Saved analysis for user ${user_uid}`);
    return res.status(200).json({ success: true, data });
  } catch (error: any) {
    console.error("❌ Failed to save analysis:", error.message);
    return res
      .status(500)
      .json({ error: error.message || "Internal server error" });
  }
}

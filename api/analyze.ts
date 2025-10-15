export const config = {
  runtime: "nodejs",
};

import { GoogleGenerativeAI } from "@google/generative-ai";

// 🔑 Ambil semua key aktif
const GEMINI_KEYS: string[] = [
  process.env.GEMINI_API_KEY,
  process.env.GEMINI_KEY_1,
  process.env.GEMINI_KEY_2,
  process.env.GEMINI_KEY_3,
].filter(Boolean) as string[];

if (GEMINI_KEYS.length === 0) {
  throw new Error("❌ Tidak ada Gemini API key di environment.");
}

// 🧠 Coba beberapa key sampai sukses
async function generateWithFallback(
  prompt: string,
  imageBase64: string,
  mimeType: string
): Promise<string> {
  let lastError: Error | null = null;
  const imageData = imageBase64.split(",")[1];

  if (!imageData) throw new Error("Gambar tidak valid.");
  if (imageData.length > 20_000_000)
    throw new Error("Ukuran gambar terlalu besar (>20MB).");

  for (const [i, key] of GEMINI_KEYS.entries()) {
    try {
      const genAI = new GoogleGenerativeAI(key);
      const model = genAI.getGenerativeModel({
        model: "gemini-1.5-flash-latest",
      });

      const response = await model.generateContent({
        contents: [
          {
            role: "user",
            parts: [
              { text: prompt },
              { inlineData: { data: imageData, mimeType } },
            ],
          },
        ],
      });

      const text = response?.response?.text?.();
      if (text?.trim()) return text;

      throw new Error("Empty Gemini response.");
    } catch (err: any) {
      console.error(`⚠️ Key ${i + 1} gagal:`, err.message);
      lastError = err;

      // Jika error dari Google sendiri (500), langsung stop loop
      if (err.message.includes("Error from API")) break;

      await new Promise((r) => setTimeout(r, 1000));
    }
  }

  throw new Error(
    lastError?.message || "Server overload atau gagal merespons. Coba lagi nanti."
  );
}

// ⚙️ Handler API
export default async function handler(req: any, res?: any) {
  try {
    const body =
      typeof req.json === "function" ? await req.json() : req.body || {};
    const { imageBase64, mimeType, pair, timeframe, risk } = body;

    if (!imageBase64 || !mimeType || !pair || !timeframe) {
      const error = { error: "Missing required fields" };
      if (res) return res.status(400).json(error);
      return new Response(JSON.stringify(error), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const prompt = `
Kamu adalah analis teknikal berpengalaman 10 tahun di pasar emas & forex.
Analisa chart ${pair} timeframe ${timeframe} dengan gaya profesional, fokus strategi efisien & low risk.

Tuliskan hasil singkat & padat (maks 6 poin):
1. Trend utama
2. Support & Resistance
3. Pola candlestick penting
4. Indikator & sinyal
5. Skenario entry (Buy/Sell)
6. Rekomendasi Entry, SL, TP (3 level)

Gunakan bahasa profesional ≤ 200 kata.
`;

    const text = await generateWithFallback(prompt, imageBase64, mimeType);

    if (res) return res.status(200).json({ text });
    return new Response(JSON.stringify({ text }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("❌ AI Error:", error);
    const errRes = {
      error: error.message || "Failed to analyze chart.",
    };
    if (res) return res.status(500).json(errRes);
    return new Response(JSON.stringify(errRes), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

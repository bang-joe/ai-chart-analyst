export const config = {
  runtime: "nodejs",
};

import { GoogleGenerativeAI } from "@google/generative-ai";

const GEMINI_KEYS: string[] = [
  process.env.GEMINI_API_KEY as string,
  process.env.GEMINI_KEY_1 as string,
  process.env.GEMINI_KEY_2 as string,
  process.env.GEMINI_KEY_3 as string,
].filter((key): key is string => Boolean(key));

if (GEMINI_KEYS.length === 0) {
  throw new Error("❌ No Gemini API keys found in Vercel environment!");
}

async function generateWithFallback(
  prompt: string,
  imageBase64: string,
  mimeType: string
): Promise<string> {
  let lastError: Error | null = null;

  for (let i = 0; i < GEMINI_KEYS.length; i++) {
    const key = GEMINI_KEYS[i];
    try {
      const genAI = new GoogleGenerativeAI(key);
      const model = genAI.getGenerativeModel({
        model: "gemini-1.5-flash-latest",
      });

      const base64data = imageBase64.split(",")[1];

      // 🔒 Batas aman gambar
      if (!base64data) throw new Error("Invalid image data");
      if (base64data.length > 20_000_000)
        throw new Error("Image too large for Gemini API (max ~20MB)");

      const aiResponse = await model.generateContent({
        contents: [
          {
            role: "user",
            parts: [
              { text: prompt },
              { inlineData: { data: base64data, mimeType } },
            ],
          },
        ],
      });

      const text = aiResponse?.response?.text?.();

      if (text && text.trim()) return text;

      throw new Error("Empty response from Gemini.");
    } catch (err: any) {
      console.warn(`⚠️ Gemini key [${i + 1}] failed: ${err.message}`);
      lastError = err;

      if (
        err.message.includes("invalid") ||
        err.message.includes("permission")
      )
        continue; // lanjut ke key berikutnya

      // cooldown antar percobaan
      await new Promise((r) => setTimeout(r, 1000));
    }
  }

  throw new Error(
    lastError?.message || "Server overload atau gagal merespons. Coba lagi nanti."
  );
}

export default async function handler(req: any, res?: any) {
  try {
    const body =
      typeof req.json === "function" ? await req.json() : req.body || {};

    const { imageBase64, mimeType, pair, timeframe, risk } = body;

    if (!imageBase64 || !mimeType || !pair || !timeframe) {
      const msg = JSON.stringify({ error: "Missing required fields" });
      if (res) return res.status(400).json(JSON.parse(msg));
      return new Response(msg, {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const prompt = `
Kamu adalah seorang analis teknikal profesional dengan pengalaman lebih dari 10 tahun di pasar emas dan forex.
Analisa chart ${pair} timeframe ${timeframe} dengan fokus pada strategi low risk dan efisiensi tinggi.

Tulis hasil singkat, jelas, dan profesional (maks 6 poin):
1. Trend Utama
2. Support & Resistance utama
3. Pola Candlestick penting
4. Indikator utama dan sinyalnya
5. Skenario Entry konservatif (Buy/Sell)
6. Rekomendasi Entry, Stop Loss, Take Profit (3 level)

Gunakan bahasa profesional dan tidak lebih dari 200 kata.
`;

    const text = await generateWithFallback(prompt, imageBase64, mimeType);

    if (res) return res.status(200).json({ text });
    return new Response(JSON.stringify({ text }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("❌ AI Error:", error);
    const msg = JSON.stringify({
      error: error.message || "Failed to analyze chart. Please try again later.",
    });

    if (res) return res.status(500).json(JSON.parse(msg));
    return new Response(msg, {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

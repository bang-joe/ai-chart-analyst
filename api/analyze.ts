export const config = {
  runtime: "nodejs",
};

import { GoogleGenerativeAI } from "@google/generative-ai";

// 🔑 Ambil semua key aktif dari environment Vercel
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

  if (!imageData) throw new Error("Gambar tidak valid atau kosong.");
  if (imageData.length > 20_000_000)
    throw new Error("Ukuran gambar terlalu besar (>20MB).");

  for (const [i, key] of GEMINI_KEYS.entries()) {
    try {
      if (!key.startsWith("AIza")) {
        console.warn(`🚫 Key [${i + 1}] format tidak valid, dilewati.`);
        continue;
      }

      const genAI = new GoogleGenerativeAI(key);
      const model = genAI.getGenerativeModel({
        // ✅ Gunakan model baru yang aktif di project lo
        model: "gemini-2.5-flash",
      });

      // Timeout otomatis (maks 12 detik)
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("⏱️ AI timeout")), 12000)
      );

      const aiResponsePromise = model.generateContent({
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

      const result: any = await Promise.race([aiResponsePromise, timeoutPromise]);
      const text = result?.response?.text?.();

      if (text && text.trim()) {
        console.log(`✅ Success dengan key [${i + 1}]`);
        return text;
      }

      throw new Error("Empty Gemini response.");
    } catch (err: any) {
      console.error(`⚠️ Key [${i + 1}] gagal:`, err.message);
      lastError = err;

      // Error API fatal, hentikan loop
      if (
        err.message.includes("API key not valid") ||
        err.message.includes("Error from API") ||
        err.message.includes("Bad Request")
      )
        break;

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
      const error = { error: "Missing required fields." };
      if (res) return res.status(400).json(error);
      return new Response(JSON.stringify(error), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const prompt = `
Kamu adalah analis teknikal profesional berpengalaman lebih dari 10 tahun di pasar emas & forex.
Analisa chart ${pair} timeframe ${timeframe} dengan fokus pada strategi efisien dan risiko rendah.

Tuliskan hasil ringkas (maks 6 poin):
1. Trend utama
2. Support & Resistance penting
3. Pola candlestick utama
4. Indikator dan sinyal dominan
5. Skenario entry (Buy/Sell)
6. Rekomendasi Entry, Stop Loss, dan Take Profit (3 level)

Gunakan bahasa profesional, maksimum 200 kata.
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

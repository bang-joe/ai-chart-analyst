export const config = {
  runtime: "nodejs",
};

import { GoogleGenerativeAI } from "@google/generative-ai";

// 🔑 Ambil semua key Gemini dari environment Vercel
const GEMINI_KEYS: string[] = [
  process.env.GEMINI_API_KEY as string,
  process.env.GEMINI_KEY_1 as string,
  process.env.GEMINI_KEY_2 as string,
  process.env.GEMINI_KEY_3 as string,
].filter((key): key is string => Boolean(key));

if (GEMINI_KEYS.length === 0) {
  throw new Error("❌ No Gemini API keys found in Vercel environment!");
}

// 🧠 Fungsi untuk coba beberapa key sampai berhasil
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

      // Timeout otomatis biar gak delay lama (15 detik)
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("⏱️ AI timeout")), 15000)
      );

      const aiResponse = model.generateContent([
        { text: prompt },
        {
          inlineData: {
            data: imageBase64.split(",")[1],
            mimeType,
          },
        },
      ]);

      const result: any = await Promise.race([aiResponse, timeoutPromise]);
      const text = result?.response?.text?.();

      if (text && text.trim()) return text;
      throw new Error("Empty response from Gemini.");
    } catch (err: any) {
      lastError = err;
      await new Promise((res) => setTimeout(res, 1200)); // jaga biar gak overload
    }
  }

  console.error("❌ All Gemini keys failed:", lastError);
  throw new Error("Server overload atau gagal merespons. Coba lagi nanti.");
}

// ⚙️ Handler pakai Web API style (Vercel-compatible)
export default async function handler(req: Request): Promise<Response> {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.json();
    const { imageBase64, mimeType, pair, timeframe, risk } = body;

    if (!imageBase64 || !mimeType || !pair || !timeframe) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 🎯 Prompt profesional
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

    return new Response(JSON.stringify({ text }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("❌ AI Error:", error);
    return new Response(
      JSON.stringify({
        error:
          error.message || "Failed to analyze chart. Please try again later.",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

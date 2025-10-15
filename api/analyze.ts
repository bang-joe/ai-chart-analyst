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

// 🧩 Fungsi untuk nyoba beberapa key sampai berhasil
async function generateWithFallback(
  prompt: string,
  imageBase64: string,
  mimeType: string
): Promise<string> {
  let lastError: Error | null = null;

  for (let i = 0; i < GEMINI_KEYS.length; i++) {
    const key = GEMINI_KEYS[i];
    console.log(`🧠 Trying Gemini key [${i + 1}]`);

    try {
      const genAI = new GoogleGenerativeAI(key);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });

      // Timeout otomatis biar gak delay lama (15 detik)
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("⏱️ AI timeout")), 15000)
      );

      // ✅ Format baru tanpa 'role'
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

      if (text && text.trim()) {
        console.log(`✅ Success with key [${i + 1}]`);
        return text;
      }

      throw new Error("Empty response from Gemini.");
    } catch (err: any) {
      console.warn(`⚠️ Gemini key [${i + 1}] failed: ${err.message}`);
      lastError = err;

      // ⏳ Delay antar key (biar gak overload bareng)
      await new Promise((res) => setTimeout(res, 1500));
    }
  }

  // 🔁 Retry sekali lagi seluruh loop setelah cooldown 3 detik
  console.log("🔁 Retrying all keys after short cooldown...");
  await new Promise((res) => setTimeout(res, 3000));

  for (let i = 0; i < GEMINI_KEYS.length; i++) {
    try {
      const key = GEMINI_KEYS[i];
      const genAI = new GoogleGenerativeAI(key);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });
      const result = await model.generateContent([{ text: prompt }]);
      const text = result?.response?.text?.();
      if (text && text.trim()) {
        console.log(`✅ Success on retry with key [${i + 1}]`);
        return text;
      }
    } catch (_) {}
  }

  console.error("❌ All Gemini keys failed:", lastError);
  throw new Error("Server overload atau gagal merespons. Coba lagi nanti.");
}

// ⚙️ Handler utama (pakai Web API style untuk Vercel)
export default async function handler(req: Request): Promise<Response> {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  const body = await req.json();
  const { imageBase64, mimeType, pair, timeframe, risk } = body;

  if (!imageBase64 || !mimeType || !pair || !timeframe) {
    return new Response(JSON.stringify({ error: "Missing required fields" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // 🎯 Prompt profesional, ringkas, dan cepat
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

  try {
    const text = await generateWithFallback(prompt, imageBase64, mimeType);
    return new Response(JSON.stringify({ text }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("❌ AI Error:", error);
    return new Response(
      JSON.stringify({
        error: error.message || "Failed to analyze chart. Please try again later.",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

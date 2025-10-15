export const config = {
  runtime: "nodejs",
};

import { GoogleGenerativeAI } from "@google/generative-ai";

// 🔑 Ambil semua key aktif dari environment
const GEMINI_KEYS: string[] = [
  process.env.GEMINI_API_KEY,
  process.env.GEMINI_KEY_1,
  process.env.GEMINI_KEY_2,
  process.env.GEMINI_KEY_3,
].filter(Boolean) as string[];

if (GEMINI_KEYS.length === 0) {
  throw new Error("❌ Tidak ada Gemini API key di environment.");
}

// 🧠 Fungsi analisa dengan fallback + timeout cerdas
async function generateWithFallback(
  prompt: string,
  imageBase64: string,
  mimeType: string
): Promise<string> {
  let lastError: Error | null = null;
  const imageData = imageBase64.split(",")[1];

  if (!imageData) throw new Error("Gambar tidak valid.");
  if (imageData.length > 25_000_000)
    throw new Error("Ukuran gambar terlalu besar (>25MB).");

  // Timeout dinaikkan agar AI punya waktu cukup memproses gambar
  const TIMEOUT_MS = 25000;

  for (const [i, key] of GEMINI_KEYS.entries()) {
    try {
      if (!key.startsWith("AIza")) {
        console.warn(`🚫 Key [${i + 1}] format tidak valid, dilewati.`);
        continue;
      }

      const genAI = new GoogleGenerativeAI(key);
      const model = genAI.getGenerativeModel({
        model: "gemini-2.5-flash",
      });

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(
          () => reject(new Error("⏱️ AI timeout (terlalu lama memproses)")),
          TIMEOUT_MS
        )
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

      const result: any = await Promise.race([
        aiResponsePromise,
        timeoutPromise,
      ]);
      const text = result?.response?.text?.();

      if (text && text.trim()) {
        console.log(`✅ Sukses dengan key [${i + 1}]`);
        return sanitizeAIOutput(text);
      }

      throw new Error("Empty Gemini response.");
    } catch (err: any) {
      console.error(`⚠️ Key [${i + 1}] gagal:`, err.message);
      lastError = err;

      if (
        err.message.includes("API key not valid") ||
        err.message.includes("Bad Request") ||
        err.message.includes("Error from API")
      )
        break;

      await new Promise((r) => setTimeout(r, 1200));
    }
  }

  throw new Error(
    lastError?.message ||
      "Server overload atau gagal merespons. Coba lagi nanti."
  );
}

// 🧩 Fungsi auto-format hasil AI biar gak bikin frontend error
function sanitizeAIOutput(text: string): string {
  let output = text.trim();

  if (!/Aksi:/i.test(output)) {
    // Coba tebak dari konteks kata "Buy" atau "Sell"
    if (/buy/i.test(output)) output = "Aksi: Buy\n" + output;
    else if (/sell/i.test(output)) output = "Aksi: Sell\n" + output;
  }

  if (!/Entry:/i.test(output)) output += "\nEntry: -";
  if (!/Stop\s?Loss:/i.test(output)) output += "\nStop Loss: -";
  if (!/Take\s?Profit:/i.test(output)) output += "\nTake Profit: -";

  return output;
}

// ⚙️ Handler utama
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

    // 🔥 Prompt yang lebih terstruktur
    const prompt = `
Kamu adalah analis teknikal profesional dengan pengalaman lebih dari 10 tahun di pasar emas dan forex.
Analisa chart ${pair} timeframe ${timeframe} dengan strategi efisien dan risiko rendah.

Tuliskan hasil analisa DALAM FORMAT TETAP seperti berikut (WAJIB ADA setiap bagian):

Aksi: (Buy atau Sell)
Entry: (Harga entry ideal)
Stop Loss: (Harga stop loss)
Take Profit: (TP1, TP2, TP3)
Analisa Singkat: (penjelasan teknikal 2-3 kalimat)

Gunakan bahasa profesional, ringkas, dan maksimum 200 kata.
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

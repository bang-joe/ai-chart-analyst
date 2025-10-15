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
].filter((k): k is string => Boolean(k));

if (GEMINI_KEYS.length === 0) {
  throw new Error("❌ Tidak ada Gemini API key di environment.");
}

// 🧠 Fungsi analisa dengan fallback dan timeout adaptif
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

  const TIMEOUT_MS = 30000; // 30 detik aman untuk model multimodal

  for (const [i, key] of GEMINI_KEYS.entries()) {
    try {
      const genAI = new GoogleGenerativeAI(key);
      const model = genAI.getGenerativeModel({
        model: "gemini-2.5-flash",
      });

      const timeout = new Promise((_, reject) =>
        setTimeout(
          () => reject(new Error("⏱️ AI timeout (terlalu lama memproses)")),
          TIMEOUT_MS
        )
      );

      const responsePromise = model.generateContent({
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

      const result: any = await Promise.race([responsePromise, timeout]);
      const text = result?.response?.text?.();

      if (text && text.trim()) {
        console.log(`✅ Sukses dengan key [${i + 1}]`);
        return sanitizeAIOutput(text);
      }

      throw new Error("Empty Gemini response.");
    } catch (err: any) {
      console.error(`⚠️ Key [${i + 1}] gagal:`, err.message);
      lastError = err;
      await new Promise((r) => setTimeout(r, 1200));
    }
  }

  throw new Error(
    lastError?.message || "Server overload atau gagal merespons. Coba lagi nanti."
  );
}

// 🧩 Pembersih hasil teks biar format rapi dan bisa diparse
function sanitizeAIOutput(text: string): string {
  let t = text
    .replace(/\*/g, "")
    .replace(/[`#]/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();

  // Tambahkan default field kalau AI lupa nulis
  if (!/Aksi:/i.test(t)) {
    if (/buy/i.test(t)) t = "Aksi: Buy\n" + t;
    else if (/sell/i.test(t)) t = "Aksi: Sell\n" + t;
    else t = "Aksi: -\n" + t;
  }
  if (!/Entry:/i.test(t)) t += "\nEntry: -";
  if (!/Stop\s?Loss:/i.test(t)) t += "\nStop Loss: -";
  if (!/Take\s?Profit/i.test(t)) t += "\nTake Profit:\n- TP1: -\n- TP2: -\n- TP3: -";
  return t;
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

    // 📊 Prompt terbaru: format padat & wajib 3 TP
    const prompt = `
Kamu adalah analis teknikal profesional dengan pengalaman lebih dari 10 tahun di pasar emas dan forex.

Analisa chart ${pair} timeframe ${timeframe} secara profesional, ringkas, dan padat. Gunakan format **tepat seperti berikut** (tanpa tambahan lain):

---
Trend Utama: [jelaskan arah trend, misal: Bullish kuat dengan higher high]
Support & Resistance: [level penting, misal: Support 2408, Resistance 2432]
Pola Candlestick: [pola utama, misal: Bullish engulfing di area support]
Indikator (MA, RSI, MACD): [sinyal indikator utama]
Penjelasan Analisa & Strategi:
[beri analisa logis dan strategi singkat untuk entry low-risk]
Rekomendasi Entry:
Aksi: [Buy/Sell]
Entry: [harga entri utama, misal: 2418.50]
Stop Loss: [harga SL, misal: 2408.00]
Take Profit 1: [misal: 2424.50]
Take Profit 2: [misal: 2432.00]
Take Profit 3: [misal: 2438.50]
---

Aturan tambahan:
- Bahasa profesional, ≤180 kata.
- Semua poin wajib diisi.
- Jangan beri penjelasan di luar format.
- Pastikan angka TP dan SL proporsional (risk/reward ≥ 1:1.5).
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

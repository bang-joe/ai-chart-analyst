// File: /api/analyze (Vercel / Next / Edge style handler — compatible with Node runtime)
export const config = {
  runtime: "nodejs",
};

import { GoogleGenerativeAI } from "@google/generative-ai";

// Ambil semua key aktif dari environment (filter undefined)
const GEMINI_KEYS: string[] = [
  process.env.GEMINI_API_KEY,
  process.env.GEMINI_KEY_1,
  process.env.GEMINI_KEY_2,
  process.env.GEMINI_KEY_3,
].filter((k): k is string => Boolean(k));

if (GEMINI_KEYS.length === 0) {
  throw new Error("❌ Tidak ada Gemini API key di environment.");
}

// generateWithFallback: coba beberapa key, timeout, retry kecil
async function generateWithFallback(
  prompt: string,
  imageBase64: string,
  mimeType: string
): Promise<string> {
  let lastError: Error | null = null;
  const imageData = imageBase64.split(",")[1];

  if (!imageData) throw new Error("Gambar tidak valid.");
  if (imageData.length > 25_000_000) throw new Error("Ukuran gambar terlalu besar (>25MB).");

  const TIMEOUT_MS = 30000;

  for (const [i, key] of GEMINI_KEYS.entries()) {
    try {
      const genAI = new GoogleGenerativeAI(key);
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

      const timeout = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("⏱️ AI timeout (terlalu lama memproses)")), TIMEOUT_MS)
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

      // Gemeni JS API shape may vary; attempt robust extraction
      const text =
        (typeof result?.response?.text === "function" && result.response.text()) ||
        result?.response?.output?.[0]?.content?.[0]?.text ||
        result?.candidates?.[0]?.content?.[0]?.text ||
        result?.output?.[0]?.text ||
        null;

      if (text && String(text).trim()) {
        console.log(`✅ Sukses dengan key [${i + 1}]`);
        return sanitizeAIOutput(String(text));
      }

      throw new Error("Empty Gemini response.");
    } catch (err: any) {
      console.error(`⚠️ Key [${i + 1}] gagal:`, err?.message || err);
      lastError = err instanceof Error ? err : new Error(String(err));
      // kecil delay sebelum coba key lain
      await new Promise((r) => setTimeout(r, 1200));
    }
  }

  throw new Error(lastError?.message || "Server overload atau gagal merespons. Coba lagi nanti.");
}

// sanitizeAIOutput: paksakan format yang parser frontend butuhkan
function sanitizeAIOutput(raw: string): string {
  let t = String(raw);

  // hapus markdown noisy chars
  t = t.replace(/\r\n/g, "\n").replace(/\*|`|#{1,}/g, "").replace(/\t/g, " ").trim();

  // normalisasi label lokal (tersedia beberapa variasi)
  // Pastikan ada blok Analisa + Rekomendasi Entry
  // Format yang kita paksa (frontend parser menunggu):
  // Trend Utama: ...
  // Support & Resistance: ...
  // Pola Candlestick: ...
  // Indikator (MA, RSI, MACD): ...
  // Penjelasan Analisa & Strategi:
  // [narasi...]
  //
  // Rekomendasi Entry:
  // Aksi: Buy|Sell
  // Entry: 4.188
  // Stop Loss: 4.198
  // Take Profit 1: 4.170
  // Take Profit 2: 4.150
  // Take Profit 3: 4.130

  // If missing main headers, attempt to extract key sentences and build blocks.
  const hasTrend = /Trend\s*Utama\s*[:\-]/i.test(t);
  const hasSR = /Support\s*(?:&|dan)?\s*Resistance\s*[:\-]/i.test(t);
  const hasCandle = /Pola\s*Candlestick\s*[:\-]/i.test(t);
  const hasInd = /Indikator\s*[:\-]/i.test(t);
  const hasExplanation = /Penjelasan Analisa\s*(?:&|dan)?\s*Strategi\s*[:\-]/i.test(t);
  const hasRec = /Rekomendasi Entry\s*[:\-]/i.test(t) || /Aksi\s*[:\-]/i.test(t);

  // Jika AI tidak mengikuti header, kita coba jadikan seluruh teks menjadi "Penjelasan" dan buat placeholder rekomendasi
  if (!hasTrend || !hasSR || !hasCandle || !hasInd || !hasExplanation) {
    // Minimal: pastikan Penjelasan Analisa & Strategi ada
    if (!hasExplanation) {
      t = "Penjelasan Analisa & Strategi:\n" + t;
    }
    // Jika header lain tidak ada, tambahkan placeholders sebelum penjelasan (so parser tetap aman)
    if (!hasTrend) t = "Trend Utama: -\n" + t;
    if (!hasSR) t = t.replace("Trend Utama:", "Trend Utama: -\nSupport & Resistance: -\nPola Candlestick: -\nIndikator (MA, RSI, MACD): -\nPenjelasan Analisa & Strategi:");
    if (!hasCandle) t = t.replace("Support & Resistance:", "Support & Resistance: -\nPola Candlestick: -\nIndikator (MA, RSI, MACD): -\nPenjelasan Analisa & Strategi:");
  }

  // Pastikan ada blok Rekomendasi Entry yang terpisah.
  if (!hasRec) {
    // Try to infer buy/sell and a numeric entry/stop/tp from text
    const maybeAction = /\b(buy|sell)\b/i.exec(t)?.[1];
    const numbers = Array.from(t.matchAll(/([0-9]+\.[0-9]+)/g)).map((m) => m[1]);
    const entry = numbers[0] ?? "-";
    const sl = numbers[1] ?? "-";
    const tp1 = numbers[2] ?? "-";
    const tp2 = numbers[3] ?? "-";
    const tp3 = numbers[4] ?? "-";

    const recBlock = `\n\nRekomendasi Entry:\nAksi: ${maybeAction ? maybeAction.toUpperCase() : "-"}\nEntry: ${entry}\nStop Loss: ${sl}\nTake Profit 1: ${tp1}\nTake Profit 2: ${tp2}\nTake Profit 3: ${tp3}\n`;

    t = t + recBlock;
  } else {
    // Jika ada "Aksi/Entry/Stop Loss/TP" tapi tidak lengkap, tambahkan placeholders per bagian
    if (!/Aksi\s*[:\-]/i.test(t)) t += "\nAksi: -";
    if (!/Entry\s*[:\-]/i.test(t)) t += "\nEntry: -";
    if (!/Stop\s*Loss\s*[:\-]/i.test(t) && !/SL\s*[:\-]/i.test(t)) t += "\nStop Loss: -";
    // normalize various TP labels into "Take Profit 1/2/3"
    if (!/Take\s*Profit\s*1\s*[:\-]/i.test(t) && !/TP1\s*[:\-]/i.test(t)) {
      t += "\nTake Profit 1: -";
    }
    if (!/Take\s*Profit\s*2\s*[:\-]/i.test(t) && !/TP2\s*[:\-]/i.test(t)) {
      t += "\nTake Profit 2: -";
    }
    if (!/Take\s*Profit\s*3\s*[:\-]/i.test(t) && !/TP3\s*[:\-]/i.test(t)) {
      t += "\nTake Profit 3: -";
    }
  }

  // Final tidy: compress multiple blank lines to one, trim
  t = t.replace(/\n{3,}/g, "\n\n").trim();

  return t;
}

// Handler utama (Vercel Node style)
export default async function handler(req: any, res?: any) {
  try {
    const body = typeof req.json === "function" ? await req.json() : req.body || {};
    const { imageBase64, mimeType, pair, timeframe, risk } = body;

    if (!imageBase64 || !mimeType || !pair || !timeframe) {
      const error = { error: "Missing required fields." };
      if (res) return res.status(400).json(error);
      return new Response(JSON.stringify(error), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Prompt yang memaksa dua blok: ANALISA lalu REKOMENDASI ENTRY (terstruktur)
    const prompt = `
Kamu adalah analis teknikal profesional dengan pengalaman lebih dari 10 tahun di pasar xauusd, crypto dan forex.

Analisa chart ${pair} timeframe ${timeframe} secara profesional, ringkas, dan padat. Gunakan format **tepat seperti berikut** (tanpa tambahan lain):

Trend Utama: [jelaskan arah trend, misal: Bullish kuat dengan higher high]
Support & Resistance: [level penting, misal: Support 2408, Resistance 2432]
Pola Candlestick: [pola utama, misal: Bullish engulfing di area support]
Indikator (MA, RSI, MACD): [sinyal indikator utama]
Penjelasan Analisa & Strategi:
[beri analisa logis dan strategi singkat — JANGAN masukkan angka Entry/SL/TP di bagian ini]

Rekomendasi Entry:
Aksi: [Buy atau Sell]
Entry: [angka, contoh: 4190.0]
Stop Loss: [angka, contoh: 4198.0]
Take Profit 1: [angka]
Take Profit 2: [angka]
Take Profit 3: [angka]

Aturan tambahan:
- Bahasa profesional, ≤180 kata untuk bagian Penjelasan.
- Semua poin wajib diisi; jika tidak memungkinkan tuliskan '-' sebagai placeholder.
- Pastikan angka TP dan SL proporsional (risk/reward ≥ 1:1.5) bila memungkinkan.
- Output harus berupa teks tunggal sesuai format di atas, tanpa JSON atau markup tambahan.
`;

    const text = await generateWithFallback(prompt, imageBase64, mimeType);

    if (res) return res.status(200).json({ text });
    return new Response(JSON.stringify({ text }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("❌ AI Error:", error);
    const errRes = { error: error?.message || "Failed to analyze chart." };
    if (res) return res.status(500).json(errRes);
    return new Response(JSON.stringify(errRes), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

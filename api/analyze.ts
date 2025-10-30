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

// UPDATE: Enhanced sanitizeAIOutput untuk struktur baru yang lebih komprehensif
function sanitizeAIOutput(raw: string): string {
  let t = String(raw);

  // hapus markdown noisy chars
  t = t.replace(/\r\n/g, "\n").replace(/\*|`|#{1,}/g, "").replace(/\t/g, " ").trim();

  // Normalisasi untuk struktur baru yang lebih komprehensif
  const requiredSections = [
    'TREND ANALYSIS & MARKET STRUCTURE',
    'KEY LEVELS IDENTIFICATION', 
    'TECHNICAL INDICATORS CONFLUENCE',
    'PRICE ACTION & CHART PATTERNS',
    'TRADING SIGNAL & EXECUTION PLAN',
    'RISK MANAGEMENT & POSITION SIZING'
  ];

  // Pastikan semua section ada
  requiredSections.forEach(section => {
    if (!t.includes(section)) {
      // Coba tambahkan section yang missing
      const sectionKey = section.split(' ')[0].toLowerCase();
      if (sectionKey === 'trend' && !/TREND ANALYSIS/i.test(t)) {
        t = `TREND ANALYSIS & MARKET STRUCTURE:\n- Primary Trend: -\n- Market Phase: -\n- Volume Analysis: -\n\n` + t;
      }
      else if (sectionKey === 'key' && !/KEY LEVELS/i.test(t)) {
        t = t.replace(/(TREND ANALYSIS.*?)(?=TECHNICAL|PRICE ACTION|TRADING SIGNAL|$)/i, 
          `$1\n\nKEY LEVELS IDENTIFICATION:\n- Strong Support: -\n- Strong Resistance: -\n- Breakout Levels: -\n\n`);
      }
      else if (sectionKey === 'technical' && !/TECHNICAL INDICATORS/i.test(t)) {
        t = t.replace(/(KEY LEVELS.*?)(?=PRICE ACTION|TRADING SIGNAL|$)/i, 
          `$1\n\nTECHNICAL INDICATORS CONFLUENCE:\n- Moving Averages: -\n- RSI Momentum: -\n- MACD Signal: -\n- Volume Confirmation: -\n\n`);
      }
      else if (sectionKey === 'price' && !/PRICE ACTION/i.test(t)) {
        t = t.replace(/(TECHNICAL INDICATORS.*?)(?=TRADING SIGNAL|$)/i, 
          `$1\n\nPRICE ACTION & CHART PATTERNS:\n- Candlestick Patterns: -\n- Chart Pattern: -\n- Supply/Demand Zones: -\n\n`);
      }
      else if (sectionKey === 'trading' && !/TRADING SIGNAL/i.test(t)) {
        t = t.replace(/(PRICE ACTION.*?)(?=RISK MANAGEMENT|$)/i, 
          `$1\n\nTRADING SIGNAL & EXECUTION PLAN:\n- Signal Type: -\n- Confidence Level: -\n- Optimal Entry Zone: -\n- Stop Loss Level: -\n- Take Profit Targets: -\n\n`);
      }
      else if (sectionKey === 'risk' && !/RISK MANAGEMENT/i.test(t)) {
        t = t + `\n\nRISK MANAGEMENT & POSITION SIZING:\n- Risk Level: -\n- Position Size: -\n- Risk-Reward Ratio: -\n- Trade Duration: -`;
      }
    }
  });

  // Pastikan format entry yang spesifik untuk frontend compatibility
  const hasEntryFormat = /Entry:\s*[0-9.-]+/i.test(t);
  if (!hasEntryFormat) {
    // Extract numbers untuk entry, SL, TP
    const numbers = Array.from(t.matchAll(/([0-9]+\.[0-9]+)/g)).map((m) => m[1]);
    const entry = numbers[0] ?? "-";
    const sl = numbers[1] ?? "-";
    const tp1 = numbers[2] ?? "-";
    const tp2 = numbers[3] ?? "-";
    const tp3 = numbers[4] ?? "-";
    
    // Cari sinyal buy/sell
    const maybeAction = /\b(buy|sell)\b/i.exec(t)?.[1] || "-";
    
    const entryBlock = `\n\nTRADING EXECUTION:\nAksi: ${maybeAction.toUpperCase()}\nEntry: ${entry}\nStop Loss: ${sl}\nTake Profit 1: ${tp1}\nTake Profit 2: ${tp2}\nTake Profit 3: ${tp3}`;
    
    t = t + entryBlock;
  }

  // Final tidy: compress multiple blank lines to one, trim
  t = t.replace(/\n{3,}/g, "\n\n").trim();

  return t;
}

// UPDATE: Handler utama dengan PROMPT BARU yang lebih maksimal untuk Gemini
export default async function handler(req: any, res?: any) {
  try {
    const body = typeof req.json === "function" ? await req.json() : req.body || {};
    const { imageBase64, mimeType, pair, timeframe, risk } = body;

    console.log("🔧 Analyze endpoint called:", { pair, timeframe, risk });

    if (!imageBase64 || !mimeType || !pair || !timeframe) {
      const error = { error: "Missing required fields." };
      if (res) return res.status(400).json(error);
      return new Response(JSON.stringify(error), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // ✅ PROMPT BARU YANG LEBIH MAKSIMAL & PROFESSIONAL UNTUK GEMINI
    const prompt = `
ANALISIS CHART PROFESSIONAL - ${pair} TIMEFRAME ${timeframe}

Sebagai AI Chart Analyst profesional dengan spesialisasi trading ${pair}, lakukan analisis teknikal komprehensif dengan struktur berikut:

## 📊 TREND ANALYSIS & MARKET STRUCTURE:
- Primary Trend Direction: 
- Market Phase (Accumulation/Markup/Distribution/Decline):
- Higher Timeframe Context:
- Volume Analysis:

## 🎯 KEY LEVELS IDENTIFICATION:
- Strong Support Levels (prioritize 3 terkuat):
- Strong Resistance Levels (prioritize 3 terkuat):
- Breakout/Breakdown Levels:
- Psychological Levels:

## 📈 TECHNICAL INDICATORS CONFLUENCE:
- Moving Averages Alignment (EMA 20, 50, 200):
- RSI Momentum & Divergence:
- MACD Signal & Histogram:
- Bollinger Bands Position:
- Volume Confirmation:

## 🕯️ PRICE ACTION & CHART PATTERNS:
- Dominant Candlestick Patterns:
- Chart Pattern Identification (Triangle, Head & Shoulders, etc.):
- Supply/Demand Zones:
- Order Flow Analysis:

## ⚡ TRADING SIGNAL & EXECUTION PLAN:
- Signal Type (BUY/SELL/NEUTRAL):
- Confidence Level (High/Medium/Low):
- Optimal Entry Zone:
- Stop Loss Level:
- Take Profit Targets (TP1, TP2, TP3):
- Timeframe Alignment:

## 🛡️ RISK MANAGEMENT & POSITION SIZING:
- Risk Level (Low/Medium/High):
- Position Size Recommendation:
- Risk-Reward Ratio:
- Trade Duration:
- Alternative Scenarios:

**TRADING EXECUTION (WAJIB di bagian akhir):**
Aksi: [BUY/SELL]
Entry: [angka]
Stop Loss: [angka]  
Take Profit 1: [angka]
Take Profit 2: [angka]
Take Profit 3: [angka]

**ATURAN ANALISIS:**
1. Fokus pada konfirmasi multi-indikator dan price action
2. Prioritaskan level-level kunci dengan confluence tertinggi
3. Berikan sinyal yang actionable dengan risk management jelas
4. Maximum 200 kata untuk setiap section utama
5. Pastikan konsistensi antara semua elemen analisis
6. Output HARUS mengandung bagian "TRADING EXECUTION" di akhir

**FORMAT OUTPUT:** 
Gunakan struktur section di atas secara tepat. Setiap section harus ada.
`;

    console.log("🔄 Calling Gemini API with enhanced prompt...");
    const text = await generateWithFallback(prompt, imageBase64, mimeType);
    console.log("✅ Enhanced Gemini analysis completed successfully");

    if (res) return res.status(200).json({ text });
    return new Response(JSON.stringify({ text }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("❌ Gemini Analysis Error:", error);
    const errRes = { error: error?.message || "Failed to analyze chart." };
    if (res) return res.status(500).json(errRes);
    return new Response(JSON.stringify(errRes), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
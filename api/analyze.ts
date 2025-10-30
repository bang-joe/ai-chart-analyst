// File: /api/analyze.ts (DEEPSEEK VERSION)
export const config = {
  runtime: "nodejs",
};

// DeepSeek API Manager
class DeepSeekManager {
  private apiConfigs = [
    {
      key: process.env.VITE_DEEPSEEK_API_KEY_1,
      url: 'https://api.malarouter.ai/v1/chat/completions', // ✅ MAIA Router
      provider: 'maia-router',
      model: 'deepseek/deepseek-chat'
    },
    {
      key: process.env.VITE_DEEPSEEK_API_KEY_2,
      url: 'https://api.malarouter.ai/v1/chat/completions', // ✅ MAIA Router
      provider: 'maia-router', 
      model: 'deepseek/deepseek-chat'
    },
    {
      key: process.env.VITE_DEEPSEEK_API_KEY_3,
      url: 'https://api.malarouter.ai/v1/chat/completions', // ✅ MAIA Router
      provider: 'maia-router',
      model: 'deepseek/deepseek-chat'
    }
  ].filter(config => config.key);

  private requestCounts = new Map<number, number>();
  private lastResetTime = Date.now();

  constructor() {
    console.log(`DeepSeek Manager initialized with ${this.apiConfigs.length} API keys`);
    this.apiConfigs.forEach((_, index) => {
      this.requestCounts.set(index, 0);
    });
  }

  private getCurrentConfig() {
    const now = Date.now();
    
    // Reset counters every minute
    if (now - this.lastResetTime > 60000) {
      this.requestCounts.forEach((_, index) => this.requestCounts.set(index, 0));
      this.lastResetTime = now;
    }

    // Find config with least usage
    let bestIndex = 0;
    let minUsage = this.requestCounts.get(0) || 0;

    for (let i = 1; i < this.apiConfigs.length; i++) {
      const usage = this.requestCounts.get(i) || 0;
      if (usage < minUsage) {
        bestIndex = i;
        minUsage = usage;
      }
    }

    // Increment usage counter
    this.requestCounts.set(bestIndex, minUsage + 1);
    return this.apiConfigs[bestIndex];
  }

  async callAPI(prompt: string, retries = 3): Promise<string> {
  if (this.apiConfigs.length === 0) {
    throw new Error('No API keys configured');
  }

  for (let attempt = 1; attempt <= retries; attempt++) {
    const config = this.getCurrentConfig();
    
    try {
      console.log(`🔧 Using ${config.provider} API (attempt ${attempt})...`);
      
      const headers: any = {
        'Authorization': `Bearer ${config.key}`,
        'Content-Type': 'application/json',
      };

      // ✅ TAMBAH OpenRouter specific headers
      if (config.provider === 'openrouter') {
        headers['HTTP-Referer'] = 'https://www.tradersxauusd.my.id';
        headers['X-Title'] = 'AI Chart Analyst';
      }
      
      const response = await fetch(config.url, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({
          model: config.model,
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 2000,
          temperature: 0.7
        })
      });

      if (response.status === 429) {
        console.log(`⏳ Rate limit on ${config.provider}, retrying...`);
        await new Promise(resolve => setTimeout(resolve, 2000 * attempt));
        continue;
      }

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`${config.provider} API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log(`✅ Success with ${config.provider}`);
      return data.choices[0].message.content;

    } catch (error) {
      console.error(`❌ Attempt ${attempt} failed with ${config.provider}:`, error);
      if (attempt === retries) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }

  throw new Error('All API providers exhausted');
}
}

const deepSeekManager = new DeepSeekManager();

// generateWithDeepSeek: Ganti fungsi Gemini dengan DeepSeek
async function generateWithDeepSeek(
  prompt: string,
  imageBase64: string
): Promise<string> {
  try {
    // DeepSeek bisa handle image dalam prompt text
    const imageInfo = `[Gambar chart trading dalam format base64: ${imageBase64.substring(0, 100)}...]`;
    
    const fullPrompt = `${prompt}\n\nData Gambar: ${imageInfo}`;
    
    const response = await deepSeekManager.callAPI(fullPrompt);
    return sanitizeAIOutput(response);
    
  } catch (error: any) {
    console.error('DeepSeek analysis error:', error);
    throw new Error(error?.message || 'Failed to analyze with DeepSeek');
  }
}

// sanitizeAIOutput: Tetap sama untuk konsistensi format
function sanitizeAIOutput(raw: string): string {
  let t = String(raw);

  // hapus markdown noisy chars
  t = t.replace(/\r\n/g, "\n").replace(/\*|`|#{1,}/g, "").replace(/\t/g, " ").trim();

  // normalisasi label lokal (tersedia beberapa variasi)
  // Pastikan ada blok Analisa + Rekomendasi Entry
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

// Handler utama - TETAP SAMA interface-nya
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

    // Prompt yang sama untuk konsistensi
    const prompt = `
Kamu adalah analis teknikal profesional dengan pengalaman lebih dari 10 tahun di pasar emas dan forex.

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

    console.log("🔄 Calling DeepSeek API...");
    const text = await generateWithDeepSeek(prompt, imageBase64);
    console.log("✅ Analysis completed successfully");

    if (res) return res.status(200).json({ text });
    return new Response(JSON.stringify({ text }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("❌ DeepSeek Analysis Error:", error);
    const errRes = { error: error?.message || "Failed to analyze chart." };
    if (res) return res.status(500).json(errRes);
    return new Response(JSON.stringify(errRes), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
// File: api/analyze.ts (FINAL FIX MODEL NAME)

import type { VercelRequest, VercelResponse } from '@vercel/node';
// MESIN BARU: Impor Pustaka AI Google
import { GoogleGenerativeAI } from '@google/generative-ai';

// --- KUNCI DIAMBIL DARI BRANKAS VERCELL ---
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
) {
  // Hanya izinkan metode POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { imageBase64, mimeType, pair, timeframe, risk } = req.body;

  if (!GEMINI_API_KEY) {
    console.error('Kunci API GEMINI tidak ditemukan di Environment Variables Vercel.');
    return res.status(500).json({ error: 'Server Error: Kunci API Gemini hilang.' });
  }

  try {
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    // PERBAIKAN KRUSIAL: Mengubah nama model ke versi yang stabil dan tersedia
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" }); 
    // CATATAN: gemini-2.5-flash mendukung input gambar (vision)

    const prompt = `Kamu adalah analis teknikal profesional. Analisa chart ${pair} pada timeframe ${timeframe} dengan risk profile ${risk}.

    **TUGAS PENTING:** Berikan hasil analisa LENGKAP dalam format TEKS yang ketat dan terstruktur. Gunakan format label berikut secara persis untuk memastikan data dapat diproses:
    1. Trend Utama: [Tuliskan trend di sini]
    2. Support & Resistance: [Tuliskan level S&R di sini]
    3. Pola Candlestick: [Tuliskan pola di sini, jika ada]
    4. Indikator: [Tuliskan kondisi indikator di sini, jika relevan]
    5. Penjelasan Analisa & Strategi: [Tuliskan penjelasan dan ringkasan strategi]
    6. Rekomendasi Entry: Aksi: [Tuliskan Buy atau Sell secara persis] Entry: [Tuliskan angka harga entry] Rasional Entry: [Tuliskan alasan teknikal mengapa entry dilakukan] Stop Loss: [Tuliskan angka harga Stop Loss] Take Profit 1: [Tuliskan angka harga TP1] Take Profit 2: [Tuliskan angka harga TP2] Take Profit 3: [Tuliskan angka harga TP3]`;

    const imagePart = {
      inlineData: {
        data: imageBase64.split(",")[1],
        mimeType: mimeType,
      },
    };

    const result = await model.generateContent([prompt, imagePart]);
    const response = result.response;
    const text = response.text();

    if (!text) {
      return res.status(500).json({ error: 'AI returned empty text.' });
    }

    return res.status(200).json({ text });

  } catch (error: any) {
    console.error('API call error:', error);
    return res.status(500).json({ error: 'Failed to get analysis. Detail: ' + error.message });
  }
}
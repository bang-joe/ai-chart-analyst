// File: App.tsx (FINAL FIX + RESTORE LAST STATE + LOAD LAST ANALYSIS)
import 'react-toastify/dist/ReactToastify.css';
import { ToastContainer, toast } from 'react-toastify';
import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "./context/AuthContext";
import { LoginScreen } from "./components/LoginScreen";
import { Header } from "./components/Header";
import { ImageUploader } from "./components/ImageUploader";
import { Loader } from "./components/Loader";
import type { Analysis } from "./types";
import { Footer } from "./components/Footer";
import AdminPanel from "./components/AdminPanel";
import { motion } from "framer-motion";
import { AnalysisResult } from './components/AnalysisResult';

// 🧩 Parsing hasil analisis AI
const parseAnalysisText = (text: string, currentRiskProfile: "Low" | "Medium"): Analysis | null => {
  try {
    // helper: bersihkan teks (hapus bullet, markdown noise) dan trim
    const clean = (s: string | null | undefined) =>
      (s || "").replace(/(\*|`|#{1,}|--)/g, " ").replace(/\s+/g, " ").trim();

    // Ambil bagian penjelasan (Penjelasan Analisa & Strategi) — sampai sebelum 'Rekomendasi Entry' atau akhir
    const explanationMatch = text.match(/Penjelasan Analisa\s*(?:&|dan)?\s*Strategi\s*[:\-\s]*([\s\S]*?)(?=(\n.*Rekomendasi Entry|\n\s*\d+\.|\n---|\n\s*$))/i);
    const explanationRaw = explanationMatch ? explanationMatch[1] : "";

    // Ambil blok rekomendasi kalau ada
    const recBlockMatch = text.match(/Rekomendasi Entry\s*[:\-\s]*([\s\S]*)/i);
    const recRaw = recBlockMatch ? recBlockMatch[1] : "";

    // Jika blok rekomendasi kosong, fallback: cari pola langsung di seluruh teks
    const searchSource = recRaw && recRaw.trim() ? recRaw : text;

    // Cari fields penting di blok rekomendasi (atau di seluruh text jika fallback)
    const actionMatch = searchSource.match(/\bAksi\s*[:\-]?\s*(Buy|Sell)/i);
    const entryMatch = searchSource.match(/\bEntry\s*[:\-]?\s*([0-9.,]+)/i);
    const slMatch = searchSource.match(/\bStop(?:\s*)Loss\s*[:\-]?\s*([0-9.,]+)/i) || searchSource.match(/\bSL\s*[:\-]?\s*([0-9.,]+)/i);
    const tp1 = searchSource.match(/\bTake Profit 1\s*[:\-]?\s*([0-9.,]+)/i) || searchSource.match(/\bTP1\s*[:\-]?\s*([0-9.,]+)/i);
    const tp2 = searchSource.match(/\bTake Profit 2\s*[:\-]?\s*([0-9.,]+)/i) || searchSource.match(/\bTP2\s*[:\-]?\s*([0-9.,]+)/i);
    const tp3 = searchSource.match(/\bTake Profit 3\s*[:\-]?\s*([0-9.,]+)/i) || searchSource.match(/\bTP3\s*[:\-]?\s*([0-9.,]+)/i);

    const tps = [tp1, tp2, tp3].filter(Boolean).map((m) => clean((m as RegExpMatchArray)[1]));

    // Validasi wajib: Aksi, Entry, SL, minimal 1 TP
    if (!actionMatch || !entryMatch || !slMatch || tps.length === 0) {
      console.error("DEBUG: Missing Trade Data. recommendation block/fallback:", searchSource);
      throw new Error("Invalid AI format — missing crucial trade data (Aksi, Entry, SL, or TP).");
    }

    // Ambil bagian lain: Trend, Support&Resistance, Candlestick, Indikator
    const trendMatch = text.match(/\bTrend Utama\s*[:\-\s]*([\s\S]*?)(?=\n\s*\d+\.|\n---|\n\s*$)/i);
    const srMatch = text.match(/\bSupport\s*(?:&|dan)?\s*Resistance\s*[:\-\s]*([\s\S]*?)(?=\n\s*\d+\.|\n---|\n\s*$)/i);
    const candleMatch = text.match(/\bPola Candlestick\s*[:\-\s]*([\s\S]*?)(?=\n\s*\d+\.|\n---|\n\s*$)/i);
    const indMatch = text.match(/\bIndikator\s*[:\-\s]*([\s\S]*?)(?=\n\s*\d+\.|\n---|\n\s*$)/i);

    // Bersihkan explanation supaya tidak menyertakan angka trade (ambil narasi saja)
    const explanation = clean(explanationRaw).replace(/\b(Entry|Stop\s*Loss|SL|Take\s*Profit|TP)[\s\S]*/i, "").trim();

    return {
      trend: clean(trendMatch ? trendMatch[1] : ""),
      supportResistance: clean(srMatch ? srMatch[1] : ""),
      candlestick: clean(candleMatch ? candleMatch[1] : ""),
      indicators: clean(indMatch ? indMatch[1] : ""),
      explanation: explanation || "-",
      recommendation: {
        action: (actionMatch ? clean(actionMatch[1]) : "Buy") as 'Buy' | 'Sell',
        entry: entryMatch ? clean(entryMatch[1]) : "-",
        entryRationale: "", // bisa ditambah parsing jika AI mengirim 'Rasional Entry'
        stopLoss: slMatch ? clean((slMatch as RegExpMatchArray)[1]) : "-",
        takeProfit: tps,
        riskProfile: currentRiskProfile,
      },
    };
  } catch (err) {
    console.error("❌ Failed to parse AI output:", err);
    throw new Error(err instanceof Error ? err.message : "AI analysis format invalid or incomplete. Please retry.");
  }
};

// 🧠 Komponen utama aplikasi (AI Analyzer)
const MainApp: React.FC = () => {
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string>("");
  const [pair, setPair] = useState("");
  const [timeframe, setTimeframe] = useState("");
  const [risk, setRisk] = useState<"Low" | "Medium">("Medium");
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  // 🟡 Restore state dari localStorage
  useEffect(() => {
    const savedPair = localStorage.getItem("pair");
    const savedTimeframe = localStorage.getItem("timeframe");
    const savedRisk = localStorage.getItem("risk");
    const savedAnalysis = localStorage.getItem("analysisResult");
    const savedPreview = localStorage.getItem("preview");

    if (savedPair) setPair(savedPair);
    if (savedTimeframe) setTimeframe(savedTimeframe);
    if (savedRisk) setRisk(savedRisk as "Low" | "Medium");
    if (savedAnalysis) setAnalysis(JSON.parse(savedAnalysis));
    if (savedPreview) setPreview(savedPreview);
  }, []);

  // 🟡 Simpan otomatis setiap perubahan
  useEffect(() => localStorage.setItem("pair", pair), [pair]);
  useEffect(() => localStorage.setItem("timeframe", timeframe), [timeframe]);
  useEffect(() => localStorage.setItem("risk", risk), [risk]);
  useEffect(() => {
    if (analysis) localStorage.setItem("analysisResult", JSON.stringify(analysis));
  }, [analysis]);
  useEffect(() => {
    if (preview) localStorage.setItem("preview", preview);
  }, [preview]);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setMimeType(f.type);
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      setPreview(result);
      setImageBase64(result);
      setAnalysis(null);
    };
    reader.readAsDataURL(f);
  };

  const handleAnalyze = useCallback(async () => {
    if (!imageBase64 || !pair || !timeframe) {
      setError("Please upload an image and complete all fields.");
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64, mimeType, pair, timeframe, risk }),
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.error || 'Server error: Gagal mendapatkan analisa.');
      const rawText = data.text;
      if (!rawText) throw new Error("Server mengembalikan data kosong.");

      toast.success("Analisis AI Selesai!", { position: "bottom-right" });
      const parsed = parseAnalysisText(rawText, risk);
      setAnalysis(parsed);

    } catch (err) {
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : "Unknown error occurred.";
      toast.error(errorMessage);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [imageBase64, mimeType, pair, timeframe, risk]);

  // 🟢 Tambahan tombol manual untuk load analisa terakhir
  const handleLoadLast = () => {
    try {
      const savedPair = localStorage.getItem("pair");
      const savedTimeframe = localStorage.getItem("timeframe");
      const savedRisk = localStorage.getItem("risk");
      const savedAnalysis = localStorage.getItem("analysisResult");
      const savedPreview = localStorage.getItem("preview");

      if (savedPair) setPair(savedPair);
      if (savedTimeframe) setTimeframe(savedTimeframe);
      if (savedRisk) setRisk(savedRisk as "Low" | "Medium");
      if (savedAnalysis) setAnalysis(JSON.parse(savedAnalysis));
      if (savedPreview) setPreview(savedPreview);

      toast.info("Last analysis loaded!", { position: "bottom-right" });
    } catch (err) {
      console.error("Failed to load last analysis:", err);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fade-in-up">
      <div className="bg-gray-800/50 p-6 rounded-2xl shadow-lg border border-gray-700 backdrop-blur-sm">
        <h2 className="text-2xl font-bold text-white mb-6">1. Upload & Configure</h2>
        <ImageUploader previewUrl={preview} onChange={handleFile} />
        <div className="space-y-4 mt-4">
          <input
            type="text"
            placeholder="Pair (e.g., XAUUSD)"
            value={pair}
            onChange={(e) => setPair(e.target.value)}
            className="w-full bg-gray-900 border border-gray-600 text-white rounded-lg px-4 py-3 focus:ring-2 focus:ring-amber-500"
          />
          <input
            type="text"
            placeholder="Timeframe (e.g., H1, H4)"
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value)}
            className="w-full bg-gray-900 border border-gray-600 text-white rounded-lg px-4 py-3 focus:ring-2 focus:ring-amber-500"
          />
          <div className="flex gap-2 mt-3">
            <button
              onClick={() => setRisk("Low")}
              className={`flex-1 py-2 rounded-md font-semibold ${risk === "Low" ? "bg-amber-600 text-white" : "bg-gray-700 text-gray-300 hover:bg-gray-600"}`}
            >
              Low Risk
            </button>
            <button
              onClick={() => setRisk("Medium")}
              className={`flex-1 py-2 rounded-md font-semibold ${risk === "Medium" ? "bg-amber-600 text-white" : "bg-gray-700 text-gray-300 hover:bg-gray-600"}`}
            >
              Medium Risk
            </button>
          </div>

          <button
            onClick={handleAnalyze}
            disabled={isLoading}
            className={`w-full font-bold py-3 px-4 rounded-lg transition-all duration-300 ${
              isLoading
                ? "bg-gray-600 cursor-wait"
                : "bg-amber-600 hover:bg-amber-700 transform hover:-translate-y-1 shadow-lg shadow-amber-500/30"
            }`}
          >
            {isLoading ? "Analyzing..." : "Analyze Chart"}
          </button>

          {/* 🟢 Tombol Load Last Analysis */}
          {localStorage.getItem("analysisResult") && (
            <button
              onClick={handleLoadLast}
              className="w-full font-semibold py-2 px-4 mt-3 rounded-lg bg-gray-700 hover:bg-gray-600 text-gray-200 transition-all"
            >
              Load Last Analysis
            </button>
          )}
        </div>
      </div>

      <div className="bg-gray-800/50 p-6 rounded-2xl shadow-lg border border-gray-700 backdrop-blur-sm relative overflow-hidden">
        <h2 className="text-2xl font-bold text-white mb-6">2. AI Analysis</h2>
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.05 }}
            className="absolute inset-0 bg-gradient-to-br from-amber-500 via-yellow-300 to-amber-600 blur-3xl animate-pulse"
          />
        )}
        <div className="min-h-[400px] flex flex-col justify-center items-center relative z-10 text-center">
          {isLoading && <Loader />}
          {error && <div className="text-red-400 bg-red-900/40 p-4 rounded-lg text-center shadow-md">{error}</div>}
          {!isLoading && !error && analysis && <AnalysisResult analysis={analysis} />}
          {!isLoading && !error && !analysis && (
            <p className="text-gray-400">Upload chart dan klik "Analyze Chart" untuk memulai analisis AI.</p>
          )}
        </div>
      </div>
    </div>
  );
};

// ⚙️ Loader layar penuh
const FullScreenLoader: React.FC = () => (
  <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center">
    <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-amber-400"></div>
    <p className="text-amber-300 mt-4">Initializing Session...</p>
  </div>
);

// ⚙️ Wrapper utama (cek login + admin)
const App: React.FC = () => {
  const { user, loading } = useAuth();
  const [showAdminPanel, setShowAdminPanel] = useState(false);

  if (loading) return <FullScreenLoader />;

  if (user?.isAdmin && showAdminPanel) {
    return <AdminPanel onClose={() => setShowAdminPanel(false)} />;
  }

  return (
    <>
      {user ? (
        <div className="min-h-screen bg-gray-900 text-gray-200 p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <Header onOpenAdmin={() => setShowAdminPanel(true)} />
            <main className="mt-8">
              <MainApp />
            </main>
            <Footer />
          </div>
        </div>
      ) : (
        <LoginScreen />
      )}
      <ToastContainer position="top-right" autoClose={3000} />
    </>
  );
};

export default App;

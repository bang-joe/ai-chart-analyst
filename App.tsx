// File: App.tsx (FINAL FIX TANPA SUPABASE AUTH + FULL RESTORE + LOAD ANALYSIS)
import 'react-toastify/dist/ReactToastify.css';
import { ToastContainer, toast } from 'react-toastify';
import React, { useState, useEffect, useCallback } from "react";
import { Header } from "./components/Header";
import { ImageUploader } from "./components/ImageUploader";
import { Loader } from "./components/Loader";
import type { Analysis } from "./types";
import { Footer } from "./components/Footer";
import AdminPanel from "./components/AdminPanel";
import { motion } from "framer-motion";
import { AnalysisResult } from './components/AnalysisResult';
import { supabase } from "./utils/supabase-client";

// 🧩 Parsing hasil analisis AI
const parseAnalysisText = (text: string, currentRiskProfile: "Low" | "Medium"): Analysis | null => {
  try {
    const extractAndClean = (matchResult: RegExpMatchArray | null, fallback: string = "N/A") => {
      if (!matchResult || !matchResult[1]) return fallback;
      return matchResult[1].replace(/(\n\s*\*|\*|--|`|#)/g, " ").replace(/\s+/g, " ").trim();
    };

    const trendMatch = text.match(/\bTrend Utama\s*[:\s]+([\s\S]*?)(?=\n\s*\d\.|\n---|\n\s*$)/i);
    const srMatch = text.match(/\bSupport & Resistance\s*[:\s]+([\s\S]*?)(?=\n\s*\d\.|\n---|\n\s*$)/i);
    const candleMatch = text.match(/\bPola Candlestick\s*[:\s]+([\s\S]*?)(?=\n\s*\d\.|\n---|\n\s*$)/i);
    const indMatch = text.match(/\bIndikator\s*[:\s]+([\s\S]*?)(?=\n\s*\d\.|\n---|\n\s*$)/i);
    const expMatch = text.match(/\bPenjelasan Analisa & Strategi\s*[:\s]+([\s\S]*?)(?=\n\s*\d\.|\n---|\n\s*$)/i);

    const recMatch = text.match(/\bRekomendasi Entry\s*[:\s]*([\s\S]*)/i);
    const recText = recMatch ? recMatch[1] : "";

    const actionMatch = recText.match(/\bAksi\s*:\s*(Buy|Sell)/i);
    const entryMatch = recText.match(/\bEntry\s*:\s*([\d.,-]+)/i);
    const reasonMatch = recText.match(/\bRasional Entry\b\s*:\s*(.*)/i);
    const slMatch = text.match(/\bStop Loss\s*:\s*([\d.,-]+)/i);
    const tp1 = recText.match(/\bTake Profit 1\s*:\s*([\d.,-]+)/i);
    const tp2 = recText.match(/\bTake Profit 2\s*:\s*([\d.,-]+)/i);
    const tp3 = recText.match(/\bTake Profit 3\s*:\s*([\d.,-]+)/i);
    const tps = [tp1, tp2, tp3].filter(Boolean).map((m) => m![1].trim());

    if (!actionMatch || !entryMatch || !slMatch || tps.length === 0) {
      console.error("DEBUG: Missing Trade Data. Text:", recText);
      throw new Error("Invalid AI format — missing crucial trade data (Aksi, Entry, SL, or TP).");
    }

    return {
      trend: extractAndClean(trendMatch),
      supportResistance: extractAndClean(srMatch),
      candlestick: extractAndClean(candleMatch),
      indicators: extractAndClean(indMatch),
      explanation: extractAndClean(expMatch),
      recommendation: {
        action: extractAndClean(actionMatch) as 'Buy' | 'Sell',
        entry: entryMatch[1].trim(),
        entryRationale: extractAndClean(reasonMatch) === "N/A" ? "" : extractAndClean(reasonMatch),
        stopLoss: slMatch[1].trim(),
        takeProfit: tps,
        riskProfile: currentRiskProfile,
      },
    };
  } catch (err) {
    console.error("❌ Failed to parse AI output:", err);
    throw new Error(err instanceof Error ? err.message : "AI analysis format invalid or incomplete. Please retry.");
  }
};

// ⚙️ Loader layar penuh
const FullScreenLoader: React.FC = () => (
  <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center">
    <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-amber-400"></div>
    <p className="text-amber-300 mt-4">Initializing Session...</p>
  </div>
);

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

  // Restore state dari localStorage
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

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fade-in-up">
      <div className="bg-gray-800/50 p-6 rounded-2xl shadow-lg border border-gray-700 backdrop-blur-sm">
        <h2 className="text-2xl font-bold text-white mb-6">1. Upload & Configure</h2>
        <ImageUploader previewUrl={preview} onChange={handleFile} />
        <button
          onClick={handleAnalyze}
          disabled={isLoading}
          className={`w-full font-bold py-3 px-4 rounded-lg mt-4 transition-all duration-300 ${
            isLoading
              ? "bg-gray-600 cursor-wait"
              : "bg-amber-600 hover:bg-amber-700 transform hover:-translate-y-1 shadow-lg shadow-amber-500/30"
          }`}
        >
          {isLoading ? "Analyzing..." : "Analyze Chart"}
        </button>
      </div>
      <div className="bg-gray-800/50 p-6 rounded-2xl shadow-lg border border-gray-700 backdrop-blur-sm">
        {isLoading ? <Loader /> : error ? (
          <div className="text-red-400 bg-red-900/40 p-4 rounded-lg">{error}</div>
        ) : analysis ? (
          <AnalysisResult analysis={analysis} />
        ) : (
          <p className="text-gray-400">Upload chart dan klik “Analyze Chart” untuk memulai analisis AI.</p>
        )}
      </div>
    </div>
  );
};

// ⚙️ Wrapper utama (cek login + admin)
const App: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [code, setCode] = useState("");
  const [showAdminPanel, setShowAdminPanel] = useState(false);

  useEffect(() => {
    const savedUser = localStorage.getItem("member_user");
    if (savedUser) setUser(JSON.parse(savedUser));
    setLoading(false);
  }, []);

  const handleLogin = async () => {
    if (!code.trim()) {
      toast.error("Masukkan kode aktivasi!");
      return;
    }
    setLoading(true);
    const { data, error } = await supabase.from("members").select("*").eq("activation_code", code.trim()).single();
    if (error || !data) {
      toast.error("Kode aktivasi tidak valid!");
      setLoading(false);
      return;
    }
    localStorage.setItem("member_user", JSON.stringify(data));
    setUser(data);
    toast.success(`Selamat datang, ${data.name}!`);
    setLoading(false);
  };

  const handleLogout = () => {
    localStorage.removeItem("member_user");
    setUser(null);
    toast.info("Logout berhasil.");
  };

  if (loading) return <FullScreenLoader />;

  if (user?.is_admin && showAdminPanel) {
    return <AdminPanel onClose={() => setShowAdminPanel(false)} />;
  }

  return (
    <>
      {user ? (
        <div className="min-h-screen bg-gray-900 text-gray-200 p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <Header
              onOpenAdmin={() => setShowAdminPanel(true)}
              onLogout={() => handleLogout()}
            />
            <main className="mt-8">
              <MainApp />
            </main>
            <Footer />
          </div>
        </div>
      ) : (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 text-gray-200">
          <h1 className="text-3xl font-bold mb-6">Masukkan Kode Aktivasi</h1>
          <input
            type="text"
            placeholder="Kode Aktivasi"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="px-4 py-2 rounded-md bg-gray-800 border border-gray-600 text-white mb-4 focus:ring-2 focus:ring-amber-500"
          />
          <button
            onClick={handleLogin}
            disabled={loading}
            className="bg-amber-600 hover:bg-amber-700 px-6 py-2 rounded-md font-semibold text-white"
          >
            {loading ? "Memproses..." : "Masuk"}
          </button>
        </div>
      )}
      <ToastContainer position="top-right" autoClose={3000} />
    </>
  );
};

export default App;

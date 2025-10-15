// File: App.tsx (FINAL FIX TANPA SUPABASE AUTH - EMAIL + KODE AKTIVASI)
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

// -------------------- Parsing AI Result --------------------
const parseAnalysisText = (text: string, currentRiskProfile: "Low" | "Medium"): Analysis | null => {
  try {
    const extractAndClean = (m: RegExpMatchArray | null, fallback = "N/A") =>
      !m || !m[1] ? fallback : m[1].replace(/(\n\s*\*|\*|--|`|#)/g, " ").replace(/\s+/g, " ").trim();

    const trend = extractAndClean(text.match(/\bTrend Utama\s*[:\s]+([\s\S]*?)(?=\n\d\.|\n---|\n$)/i));
    const sr = extractAndClean(text.match(/\bSupport & Resistance\s*[:\s]+([\s\S]*?)(?=\n\d\.|\n---|\n$)/i));
    const candle = extractAndClean(text.match(/\bPola Candlestick\s*[:\s]+([\s\S]*?)(?=\n\d\.|\n---|\n$)/i));
    const indicator = extractAndClean(text.match(/\bIndikator\s*[:\s]+([\s\S]*?)(?=\n\d\.|\n---|\n$)/i));
    const explain = extractAndClean(text.match(/\bPenjelasan Analisa & Strategi\s*[:\s]+([\s\S]*?)(?=\n\d\.|\n---|\n$)/i));

    const rec = text.match(/\bRekomendasi Entry\s*[:\s]*([\s\S]*)/i)?.[1] ?? "";
    const action = extractAndClean(rec.match(/\bAksi\s*:\s*(Buy|Sell)/i));
    const entry = extractAndClean(rec.match(/\bEntry\s*:\s*([\d.,-]+)/i));
    const reason = extractAndClean(rec.match(/\bRasional Entry\s*:\s*(.*)/i));
    const sl = extractAndClean(text.match(/\bStop Loss\s*:\s*([\d.,-]+)/i));
    const tps = ["Take Profit 1", "Take Profit 2", "Take Profit 3"]
      .map(k => rec.match(new RegExp(`\\b${k}\\s*:\\s*([\\d.,-]+)`, "i")))
      .filter(Boolean)
      .map(m => m![1].trim());

    if (!action || !entry || !sl || !tps.length) throw new Error("Format analisa tidak lengkap.");

    return {
      trend,
      supportResistance: sr,
      candlestick: candle,
      indicators: indicator,
      explanation: explain,
      recommendation: {
        action: action as 'Buy' | 'Sell',
        entry,
        entryRationale: reason,
        stopLoss: sl,
        takeProfit: tps,
        riskProfile: currentRiskProfile,
      },
    };
  } catch (err) {
    console.error("❌ Parse Error:", err);
    throw new Error("AI output format invalid. Silakan analisa ulang.");
  }
};

// -------------------- Komponen Analisa --------------------
const MainApp: React.FC = () => {
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState("");
  const [pair, setPair] = useState("");
  const [timeframe, setTimeframe] = useState("");
  const [risk, setRisk] = useState<"Low" | "Medium">("Medium");
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

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
    if (!imageBase64 || !pair || !timeframe) return setError("Lengkapi data sebelum analisa.");
    setError(null);
    setIsLoading(true);
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64, mimeType, pair, timeframe, risk }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Server error.");
      const parsed = parseAnalysisText(data.text, risk);
      setAnalysis(parsed);
      toast.success("Analisis selesai!");
    } catch (err) {
      toast.error((err as Error).message);
      setError((err as Error).message);
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
            isLoading ? "bg-gray-600 cursor-wait" : "bg-amber-600 hover:bg-amber-700 shadow-lg"
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
          <p className="text-gray-400">Upload chart dan klik “Analyze Chart”.</p>
        )}
      </div>
    </div>
  );
};

// -------------------- Komponen Utama --------------------
const App: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [showAdminPanel, setShowAdminPanel] = useState(false);

  useEffect(() => {
    const savedUser = localStorage.getItem("tradersxauusd_user");
    if (savedUser) setUser(JSON.parse(savedUser));
    setLoading(false);
  }, []);

  const handleLogin = async () => {
    if (!email.trim() || !code.trim()) {
      toast.error("Masukkan email dan kode aktivasi!");
      return;
    }

    setLoading(true);

    const { data, error } = await supabase
      .from("members")
      .select("*")
      .eq("email", email.trim())
      .eq("activation_code", code.trim())
      .eq("is_active", true)
      .single();

    if (error || !data) {
      toast.error("Email atau kode aktivasi tidak valid.");
      setLoading(false);
      return;
    }

    localStorage.setItem("tradersxauusd_user", JSON.stringify(data));
    setUser(data);
    toast.success(`Selamat datang, ${data.name}!`);
    setLoading(false);
  };

  const handleLogout = () => {
    localStorage.removeItem("tradersxauusd_user");
    setUser(null);
    toast.info("Logout berhasil.");
  };

  if (loading)
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 text-amber-400">
        <Loader />
        <p className="mt-4">Memuat aplikasi...</p>
      </div>
    );

  if (user?.is_admin && showAdminPanel)
    return <AdminPanel onClose={() => setShowAdminPanel(false)} />;

  return (
    <>
      {user ? (
        <div className="min-h-screen bg-gray-900 text-gray-200 p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <Header onOpenAdmin={() => setShowAdminPanel(true)} onLogout={() => handleLogout()} />
            <main className="mt-8">
              <MainApp />
            </main>
            <Footer />
          </div>
        </div>
      ) : (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 text-gray-200">
          <h1 className="text-4xl font-bold mb-6 text-amber-400">Login ke Tradersxauusd</h1>
          <p className="text-gray-400 mb-6">Masukkan Email dan Kode Aktivasi Anda.</p>

          <input
            type="email"
            placeholder="Email Gmail Anda"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-80 px-4 py-3 mb-3 rounded-md bg-gray-800 border border-gray-600 text-white text-center focus:ring-2 focus:ring-amber-500"
          />
          <input
            type="text"
            placeholder="Kode Aktivasi"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="w-80 px-4 py-3 mb-4 rounded-md bg-gray-800 border border-gray-600 text-white text-center focus:ring-2 focus:ring-amber-500"
          />

          <button
            onClick={handleLogin}
            disabled={loading}
            className="bg-amber-600 hover:bg-amber-700 px-6 py-2 rounded-md font-semibold text-white transition-all"
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

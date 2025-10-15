// File: App.tsx (FINAL FIXED PARSER + SESSION AUTO REFRESH)

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
import { supabase } from "./utils/supabase-client";
import { AnalysisResult } from './components/AnalysisResult';

// 🧩 Parsing hasil analisis AI (bersih & fleksibel, pisah rekomendasi)
const parseAnalysisText = (
  text: string,
  currentRiskProfile: "Low" | "Medium"
): Analysis | null => {
  try {
    const clean = (val: string | null | undefined): string =>
      (val || "").replace(/(\*|`|#|--)/g, "").trim();

    const aksi =
      text.match(/Aksi\s*[:\-]?\s*(Buy|Sell)/i)?.[1] || "Buy";

    // ✅ Tangkap semua variasi gaya entry (Entry, Buy Limit, Sell Stop, dll.)
    const entry =
      text.match(/\b(?:Entry|Buy\s+Limit|Sell\s+Limit|Buy\s+Stop|Sell\s+Stop)\s*[@:\-]?\s*([\d.,]+)/i)?.[1] || "-";

    // ✅ Tangkap SL dari berbagai format
    const sl =
      text.match(/\b(?:Stop\s*Loss|SL|Stop)\s*[@:\-]?\s*([\d.,]+)/i)?.[1] || "-";

    // ✅ Tangkap semua Take Profit
    const tpMatches = Array.from(
      text.matchAll(/\bTake\s*Profit\s*\d*\s*[@:\-]?\s*([\d.,]+)/gi)
    );
    const tps = tpMatches.map((m) => clean(m[1]));

    const trend =
      text.match(/\bTrend Utama\s*[:\-]?\s*(.*)/i)?.[1] || "-";
    const supportResistance =
      text.match(/\bSupport\s*&\s*Resistance\s*[:\-]?\s*(.*)/i)?.[1] || "-";
    const candlestick =
      text.match(/\bPola Candlestick\s*[:\-]?\s*(.*)/i)?.[1] || "-";
    const indicators =
      text.match(/\bIndikator\s*[:\-]?\s*(.*)/i)?.[1] || "-";

    // 🧼 Ambil penjelasan strategi tapi bersihkan baris Entry/SL/TP dari dalamnya
    let explanation =
      text.match(/\bPenjelasan Analisa\s*&?\s*Strategi\s*[:\-]?\s*([\s\S]*)/i)
        ?.[1] || "-";
    explanation = clean(explanation)
      .replace(/^&?\s*Strategi[:\s]*/i, "")
      .replace(/&\s*Strategi:?/gi, "")
      .replace(/Entry\s*[:@\-]?.*/gi, "")
      .replace(/Stop\s*Loss\s*[:@\-]?.*/gi, "")
      .replace(/Take\s*Profit\s*\d*\s*[:@\-]?.*/gi, "")
      .replace(/TP\d*[:@\-]?.*/gi, "")
      .trim();

    if (!aksi || !entry || !sl || tps.length === 0) {
      console.error("DEBUG: Missing Trade Data:", text);
      throw new Error(
        "Invalid AI format — missing crucial trade data (Aksi, Entry, SL, or TP)."
      );
    }

    return {
      trend: clean(trend),
      supportResistance: clean(supportResistance),
      candlestick: clean(candlestick),
      indicators: clean(indicators),
      explanation: explanation || "-", // ✅ sudah bersih tanpa rekomendasi angka
      recommendation: {
        action: clean(aksi) as "Buy" | "Sell",
        entry: clean(entry),
        entryRationale: "",
        stopLoss: clean(sl),
        takeProfit: tps.length > 0 ? tps : ["-"],
        riskProfile: currentRiskProfile,
      },
    };
  } catch (err) {
    console.error("❌ Failed to parse AI output:", err);
    throw new Error(
      err instanceof Error
        ? err.message
        : "AI analysis format invalid or incomplete. Please retry."
    );
  }
};
;

// 🧠 Komponen utama aplikasi
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

  // Restore state
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

  // Save otomatis
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
      let retries = 3;
      let data: any = null;
      let response: Response | null = null;

      while (retries > 0) {
        response = await fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageBase64, mimeType, pair, timeframe, risk }),
        });

        try {
          data = await response.json();
        } catch {
          data = null;
        }

        if (response.ok && data?.text) break;

        console.warn(`Retrying... (${4 - retries} of 3)`);
        retries--;

        if (retries > 0) {
          toast.info("Server sibuk, mencoba lagi...", { position: "bottom-right" });
          await new Promise((r) => setTimeout(r, 2500));
        }
      }

      if (!response?.ok || !data?.text) {
        throw new Error("Server overload atau gagal merespons. Coba lagi nanti.");
      }

      const rawText = data.text;
      toast.success("Analisis AI Selesai!", { position: "bottom-right" });
      const parsed = parseAnalysisText(rawText, risk);
      setAnalysis(parsed);

    } catch (err) {
      console.error(err);
      const errorMessage =
        err instanceof Error ? err.message : "Unknown error occurred.";
      toast.error(errorMessage, { position: "bottom-right" });
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [imageBase64, mimeType, pair, timeframe, risk]);

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

  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "TOKEN_REFRESHED") console.log("🔁 Token refreshed successfully.");
      if (event === "SIGNED_OUT" || !session) {
        console.warn("⚠️ Session expired or signed out.");
        localStorage.removeItem("authUser");
      }
    });
    return () => listener.subscription.unsubscribe();
  }, []);

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
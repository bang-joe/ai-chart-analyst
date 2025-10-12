// File: App.tsx (FINAL FIX PROPS, ADMIN PANEL, DAN THEME CONTEXT)

import 'react-toastify/dist/ReactToastify.css';
import { ToastContainer, toast } from 'react-toastify';

import React, { useState, useEffect, useCallback, createContext, useContext } from "react";
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

type Theme = 'dark' | 'light';

// --- THEME CONTEXT ---
interface ThemeContextType {
    theme: Theme;
    toggleTheme: () => void;
}
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);
export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};
// --- END THEME CONTEXT ---

// 🧩 Parsing hasil analisis AI (Tidak ada perubahan)
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
    const slMatch = recText.match(/\bStop Loss\s*:\s*([\d.,-]+)/i);
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

// 🧠 Main Application Component
const MainApp: React.FC = () => {
  // FINAL FIX: Panggil useTheme untuk mendapatkan nilai yang benar
  const { theme } = useTheme(); 

  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string>("");
  const [pair, setPair] = useState(""); // Dikembalikan ke kosong
  const [timeframe, setTimeframe] = useState(""); // Dikembalikan ke kosong
  const [risk, setRisk] = useState<"Low" | "Medium">("Medium");
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const { user } = useAuth();
  // FINAL FIX: Set showAdmin ke true jika user adalah admin
  const [showAdmin, setShowAdmin] = useState(user?.isAdmin || false); 
  
  // 📁 Handle Upload Image (sama)
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

  // ⚙️ Handle AI Analysis (sama)
  const handleAnalyze = useCallback(async () => {
    if (!imageBase64 || !pair || !timeframe) {
      setError("Please upload an image and complete all fields.");
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      // PANGGIL LANGSUNG KE API VERCEL
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64, mimeType, pair, timeframe, risk }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Server error: Gagal mendapatkan analisa.');
      }
      
      const rawText = data.text;
      if (!rawText) {
        throw new Error("Server mengembalikan data kosong.");
      }
      
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
    <div className={`min-h-screen bg-gray-900 text-gray-200 p-4 sm:p-6 lg:p-8 ${theme === 'light' ? 'light-mode-specific-styles' : ''}`}>
      <div className="max-w-7xl mx-auto">
        <Header /> {/* Header menggunakan Context */}

        {/* PERUBAHAN: Tombol Admin untuk switching */}
        {user?.isAdmin && (
          <div className="mt-4 flex justify-end">
            <button
              onClick={() => setShowAdmin(!showAdmin)}
              className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-300 ${
                showAdmin ? "bg-red-600 hover:bg-red-700" : "bg-blue-600 hover:bg-blue-700"
              } text-white`}
            >
              {showAdmin ? "Kembali ke Analisis" : "Buka Admin Panel"}
            </button>
          </div>
        )}

        <main className="mt-8">
          {/* LOGIC YANG MENGAKTIFKAN ADMIN PANEL */}
          {showAdmin && user?.isAdmin ? (
            <AdminPanel onClose={() => setShowAdmin(false)} />
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fade-in-up">
              {/* Sisa kode App/Analisis Anda */}
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
                      className={`flex-1 py-2 rounded-md font-semibold ${
                        risk === "Low" ? "bg-amber-600 text-white" : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                      }`}
                    >
                      Low Risk
                    </button>
                    <button
                      onClick={() => setRisk("Medium")}
                      className={`flex-1 py-2 rounded-md font-semibold ${
                        risk === "Medium" ? "bg-amber-600 text-white" : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                      }`}
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
                </div>
              </div>

              {/* RIGHT */}
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
                  {error && (
                    <div className="text-red-400 bg-red-900/40 p-4 rounded-lg text-center shadow-md">{error}</div>
                  )}
                  {/* Asumsikan AnalysisResult di-import */}
                  {!isLoading && !error && analysis && <AnalysisResult analysis={analysis} />}
                  {!isLoading && !error && !analysis && (
                    <p className="text-gray-400">Upload chart dan klik "Analyze Chart" untuk memulai analisis AI.</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </main>

        <Footer />
      </div>
    </div>
  );
};

// ⚙️ Loader layar penuh (sama)
const FullScreenLoader: React.FC = () => (
  <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center">
    <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-amber-400"></div>
    <p className="text-amber-300 mt-4">Initializing Session...</p>
  </div>
);

// ⚙️ Wrapper utama (cek login)
const App: React.FC = () => {
  // --- THEME LOGIC UTAMA ---
  const [theme, setTheme] = useState<Theme>(() => {
    return (localStorage.getItem('theme') as Theme) || 'dark';
  });

  const toggleTheme = () => {
    setTheme(current => {
      const newTheme = current === 'dark' ? 'light' : 'dark';
      return newTheme;
    });
  };

  useEffect(() => {
    document.body.className = ''; // Reset class
    document.body.classList.add(theme);
    localStorage.setItem('theme', theme);
  }, [theme]);
  // --- AKHIR THEME LOGIC UTAMA ---

  const { user, loading } = useAuth();
  if (loading) return <FullScreenLoader />;

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}> {/* WRAP DENGAN PROVIDER */}
      <>
        {/* Halaman utama */}
        {user ? <MainApp /> : <LoginScreen />}
        <ToastContainer position="top-right" autoClose={3000} />
      </>
    </ThemeContext.Provider>
  );
};

export default App;
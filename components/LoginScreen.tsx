// File: components/LoginScreen.tsx (FINAL CLEAN + LINK AKTIVASI)
import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { Logo } from "./Logo";
import { toast } from "react-toastify";
import { motion, AnimatePresence } from "framer-motion";
import { getTestimonials, subscribeTestimonials } from "../lib/supabase";

export const LoginScreen: React.FC = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // --- TESTIMONI REALTIME SLIDER (satu-satunya deklarasi) ---
const [testimonials, setTestimonials] = useState<any[]>([]);
const [currentIndex, setCurrentIndex] = useState(0);

useEffect(() => {
  let unsubscribe: (() => void) | null = null;

  const fetchAndSubscribe = async () => {
    try {
      const data = await getTestimonials();
      setTestimonials(data || []);

      // subscribeRealtime -> subscribeTestimonials harus mengembalikan fungsi unsubscribe (sync)
      unsubscribe = subscribeTestimonials(() => {
        getTestimonials().then((data) => setTestimonials(data || []));
      });
    } catch (err) {
      console.error("failed load testimonials", err);
    }
  };

  fetchAndSubscribe();

  return () => {
    if (unsubscribe) unsubscribe();
  };
}, []);

// Auto-slide
useEffect(() => {
  if (!testimonials || testimonials.length === 0) return;
  const timer = setInterval(() => {
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
  }, 5000);
  return () => clearInterval(timer);
}, [testimonials]);

  // --- KONFIGURASI LINK DAN ADMIN ---
  const ADMIN_TELEGRAM = "TradersXauUsd";
  const TELEGRAM_CONTACT = `https://t.me/${ADMIN_TELEGRAM}`;
  const TELEGRAM_CHANNEL = "https://t.me/MarketOutlookTradersxauusd";
  const TIKTOK_LINK = "https://www.tiktok.com/@tradersxauusd";
  const ACTIVATION_PURCHASE_LINK =
    "https://lynk.id/tradersxauusd/e3gl86wpzzw8";

  // --- HANDLER LOGIN ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !code.trim()) {
      setError("Please enter both email and activation code.");
      return;
    }

    setIsLoggingIn(true);
    setError(null);

    try {
      await login(email, code);
      toast.success("✅ Login berhasil! Selamat datang di AI Chart Analyst.", {
        position: "top-right",
        autoClose: 3000,
      });
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Terjadi kesalahan saat login. Coba lagi.";
      toast.error(message);
      setError(message);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const currentYear = new Date().getFullYear();

  return (
    <div className="min-h-screen bg-gray-900 text-gray-200 flex flex-col justify-center items-center p-4 relative">
      <div className="flex flex-col items-center justify-center flex-grow">
        {/* LOGO + TITLE */}
        <div className="text-center mb-8 animate-fade-in-down">
          <div className="flex items-center justify-center gap-3 sm:gap-4 mx-auto mb-4 w-fit">
            <Logo className="w-10 h-10 sm:w-12 sm:h-12 text-amber-400" />
            <h1 className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-yellow-300 pb-2">
              AI Chart Analyst
            </h1>
          </div>
          <p className="text-lg text-gray-400">
            Login with your credentials to continue.
          </p>
        </div>

        {/* LOGIN BOX */}
        <div className="w-full max-w-sm bg-gray-800/50 p-8 rounded-2xl shadow-lg border border-gray-700 backdrop-blur-sm animate-fade-in-up transition-all duration-500 hover:shadow-amber-500/10 hover:border-amber-500/30">
          <form onSubmit={handleSubmit}>
            <h2 className="text-xl font-bold text-white text-center mb-6">
              Account Login
            </h2>

            {error && (
              <p className="text-sm text-center text-red-400 mb-4">{error}</p>
            )}

            <div className="space-y-4">
              <div>
                <label htmlFor="email" className="sr-only">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email Address"
                  className="w-full bg-gray-900 border border-gray-600 text-white rounded-lg px-4 py-3 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all duration-300"
                  disabled={isLoggingIn}
                  required
                />
              </div>
              <div>
                <label htmlFor="activation-code" className="sr-only">
                  Activation Code
                </label>
                <input
                  type="text"
                  id="activation-code"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="Activation Code"
                  className="w-full bg-gray-900 border border-gray-600 text-white rounded-lg px-4 py-3 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all duration-300"
                  disabled={isLoggingIn}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoggingIn || !email || !code}
              className={`w-full font-bold py-3 px-4 rounded-lg transition-all duration-300 flex justify-center items-center mt-6 ${
                isLoggingIn || !email || !code
                  ? "bg-gray-600 cursor-not-allowed"
                  : "bg-amber-600 hover:bg-amber-700 transform hover:-translate-y-0.5 text-white shadow-xl shadow-amber-600/40"
              }`}
            >
              {isLoggingIn && (
                <div className="w-5 h-5 border-2 border-dashed rounded-full animate-spin border-white"></div>
              )}
              <span className="ml-2">
                {isLoggingIn ? "Logging In..." : "Login / Activate"}
              </span>
            </button>
          </form>

          {/* SECTION: LINKS */}
          <div className="mt-6 border-t border-gray-700 pt-6 space-y-3">
            <p className="text-sm text-gray-400 text-center">
              Tidak punya kode aktivasi?
            </p>

            <a
              href={ACTIVATION_PURCHASE_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full text-center py-3 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold transition-all duration-300 shadow-lg shadow-amber-600/30 hover:scale-[1.02]"
            >
              🔐 Beli Kode Aktivasi
            </a>

            <a
              href={TELEGRAM_CONTACT}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full text-center py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold transition-all duration-300 shadow-lg shadow-blue-600/30 hover:scale-[1.02]"
            >
              💬 Tanya Admin via Telegram
            </a>

            <div className="flex justify-center space-x-6 mt-4 text-sm font-semibold">
              <a
                href={TELEGRAM_CHANNEL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-amber-500 transition-all"
              >
                Telegram Channel
              </a>
              <a
                href={TIKTOK_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-amber-500 transition-all"
              >
                TikTok
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* TESTIMONIAL SECTION */}
{testimonials.length > 0 && (
  <div className="w-full max-w-lg mx-auto mt-10 ...">
    <h3 className="text-center text-amber-400 text-xl font-bold mb-4">
      Apa Kata Pengguna
    </h3>

    <div className="relative h-[180px] flex items-center justify-center">
      <AnimatePresence mode="wait">
        <motion.div
          key={testimonials[currentIndex]?.id ?? currentIndex}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.6 }}
          className="absolute w-full text-center px-4"
        >
          <p className="text-gray-200 italic text-lg leading-relaxed">
            “{(testimonials[currentIndex].text || "").length > 200
              ? (testimonials[currentIndex].text as string).slice(0, 200) + "..."
              : testimonials[currentIndex].text}
            ”
          </p>

          <div className="flex justify-center items-center mt-4 space-x-2">
            {[...Array(testimonials[currentIndex].rating || 5)].map((_, idx) => (
              <svg key={idx} className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.974a1 1 0 00.95.69h4.178c.969 0 1.372 1.24.588 1.81l-3.384 2.46a1 1 0 00-.364 1.118l1.286 3.974c.3.921-.755 1.688-1.54 1.118l-3.384-2.46a1 1 0 00-1.176 0l-3.384 2.46c-.785.57-1.84-.197-1.54-1.118l1.286-3.974a1 1 0 00-.364-1.118L2.049 9.4c-.784-.57-.38-1.81.588-1.81h4.178a1 1 0 00.95-.69l1.286-3.974z" />
              </svg>
            ))}
          </div>

          <p className="mt-3 text-sm text-gray-400 font-medium">
            — {testimonials[currentIndex].author || "Member"}
          </p>
        </motion.div>
      </AnimatePresence>
    </div>

    <div className="flex justify-center mt-6 space-x-2">
      {testimonials.map((_, i) => (
        <button
          key={i}
          onClick={() => setCurrentIndex(i)}
          className={`w-2.5 h-2.5 rounded-full transition-all ${i === currentIndex ? "bg-amber-400 w-3.5" : "bg-gray-600"}`}
          aria-label={`go to testimonial ${i + 1}`}
        />
      ))}
    </div>
  </div>
)}

      {/* FOOTER */}
      <footer className="mt-8 py-3 text-center text-gray-500 text-sm w-full">
        <p>&copy; {currentYear} Tradersxauusd. All rights reserved.</p>
        <p className="text-xs mt-1">
          Powered by <span className="text-amber-500">AI Chart Analyst</span>
        </p>
      </footer>
    </div>
  );
};

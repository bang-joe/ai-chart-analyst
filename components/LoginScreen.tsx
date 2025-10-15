// File: LoginScreen.tsx (FINAL + FEEDBACK & LINK PEMBELIAN AKTIVASI)

import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext'; 
import { Logo } from './Logo';
import { toast } from 'react-toastify'; 

export const LoginScreen: React.FC = () => {
    const { login } = useAuth(); 
    const [email, setEmail] = useState('');
    const [code, setCode] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isLoggingIn, setIsLoggingIn] = useState(false);
    const [feedback, setFeedback] = useState(''); // 🆕 untuk form feedback

    // --- KONFIGURASI TELEGRAM ADMIN FINAL ---
    const ADMIN_TELEGRAM_USERNAME = 'TradersXauUsd';
    const TELEGRAM_MESSAGE = encodeURIComponent(
        `Halo Admin, saya ingin bertanya bagaimana cara akses AI Chart Analyst ini.`
    );
    const telegramLink = `https://t.me/${ADMIN_TELEGRAM_USERNAME}?start=${TELEGRAM_MESSAGE}`;

    // KONFIGURASI SOSIAL MEDIA
    const TELEGRAM_LINK = "https://t.me/MarketOutlookTradersxauusd";
    const TIKTOK_LINK = "https://www.tiktok.com/@tradersxauusd";

    // 🔗 Link pembelian kode aktivasi
    const PURCHASE_LINK = "https://lynk.id/tradersxauusd/e3gl86wpzzw8";

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!code.trim() || !email.trim()) {
            setError('Please enter both email and activation code.');
            return;
        }
        setError(null);
        setIsLoggingIn(true);
        
        try {
            await login(email, code); 
            toast.success("Login berhasil! Selamat datang di AI Chart Analyst.", {
                position: "top-right",
                autoClose: 3000,
            });
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred. Please try again.';
            toast.error(errorMessage);
            setError(errorMessage);
        } finally {
             setIsLoggingIn(false);
        }
    };

    const handleFeedbackSubmit = () => {
        if (!feedback.trim()) {
            toast.warning("Tulis pesan feedback terlebih dahulu!");
            return;
        }
        toast.info("Terima kasih! Pesanmu sudah terkirim ke admin.");
        setFeedback('');
    };

    const currentYear = new Date().getFullYear();

    const customAnimations = `
        @keyframes shake {
            0%, 100% {transform: translateX(0);}
            20%, 60% {transform: translateX(-5px);}
            40%, 80% {transform: translateX(5px);}
        }
        .animate-shake {
            animation: shake 0.5s ease-in-out;
        }
    `;

    return (
        <div className="min-h-screen bg-gray-900 text-gray-200 font-sans flex flex-col justify-center items-center p-4 relative">
            
            {/* Inject Custom CSS */}
            <style>{customAnimations}</style>

            <div className="flex flex-col items-center justify-center flex-grow"> 
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
                <div className="w-full max-w-sm bg-gray-800/50 p-8 rounded-2xl shadow-lg border border-gray-700 backdrop-blur-sm animate-fade-in-up transition-all duration-500 hover:shadow-amber-500/10 hover:border-amber-500/30">
                    <form onSubmit={handleSubmit}>
                        <h2 className="text-xl font-bold text-white text-center mb-6">Account Login</h2>

                        {error && <p className="text-sm text-center text-red-400 animate-shake mb-4">{error}</p>}
                        
                        <div className="space-y-4">
                            <div>
                                <label htmlFor="email" className="sr-only">Email</label>
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
                                <label htmlFor="activation-code" className="sr-only">Activation Code</label>
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
                            disabled={isLoggingIn || !code || !email}
                            className={`w-full font-bold py-3 px-4 rounded-lg transition-all duration-300 flex justify-center items-center mt-6 ${
                                (isLoggingIn || !code || !email)
                                    ? 'bg-gray-600 cursor-not-allowed text-white'
                                    : 'bg-amber-600 hover:bg-amber-700 transform hover:-translate-y-0.5 text-white shadow-xl shadow-amber-600/40'
                            }`}
                        >
                            {isLoggingIn && (
                               <div className="w-5 h-5 border-2 border-dashed rounded-full animate-spin border-white"></div>
                            )}
                            <span className="ml-2">
                                {isLoggingIn ? 'Logging In...' : 'Login / Activate'}
                            </span>
                        </button>
                    </form>

                    {/* TOMBOL TELEGRAM & SOSIAL MEDIA */}
                    <div className="mt-6 border-t border-gray-700 pt-6">
                        <p className="text-sm text-gray-400 mb-3 text-center">
                            Butuh bantuan atau kode aktivasi?
                        </p>
                        
                        {/* Tombol Kontak Utama (Telegram) */}
                        <a
                            href={telegramLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full flex items-center justify-center py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold transition-all duration-300 shadow-lg shadow-blue-600/30 hover:shadow-blue-500/50 hover:scale-[1.01]"
                        >
                            Tanya Admin via Telegram
                        </a>

                        {/* 🛒 Link Pembelian Kode Aktivasi */}
                        <a
                            href={PURCHASE_LINK}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-4 block text-center w-full py-3 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-bold transition-all duration-300 shadow-lg shadow-amber-500/40 hover:scale-[1.02]"
                        >
                            🔑 Beli Kode Aktivasi Disini
                        </a>

                        {/* Tulisan Follow Media Sosial */}
                        <div className="flex justify-center space-x-6 mt-4 text-sm font-semibold">
                            <a href={TELEGRAM_LINK} target="_blank" rel="noopener noreferrer" aria-label="Telegram" 
                               className="text-gray-400 hover:text-amber-500 transition-colors transform hover:scale-105">
                                Telegram
                            </a>
                            <a href={TIKTOK_LINK} target="_blank" rel="noopener noreferrer" aria-label="TikTok" 
                               className="text-gray-400 hover:text-amber-500 transition-colors transform hover:scale-105">
                                TikTok
                            </a>
                        </div>

                        {/* 💬 FEEDBACK SECTION */}
                        <div className="mt-6">
                            <p className="text-sm text-gray-400 mb-2 text-center">Ada kendala login? Kirim feedback cepat:</p>
                            <textarea
                                value={feedback}
                                onChange={(e) => setFeedback(e.target.value)}
                                placeholder="Tulis pesanmu di sini..."
                                rows={3}
                                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 resize-none focus:outline-none focus:ring-2 focus:ring-amber-500"
                            ></textarea>
                            <button
                                onClick={handleFeedbackSubmit}
                                className="mt-2 w-full bg-gray-700 hover:bg-green-600 text-white text-sm py-2 rounded-lg font-semibold transition-all duration-300"
                            >
                                Kirim Feedback
                            </button>
                        </div>
                    </div>
                    {/* END TOMBOL TELEGRAM & SOSIAL MEDIA */}
                </div>
            </div>
            
            {/* FOOTER & COPYRIGHT */}
            <footer className="mt-8 py-3 text-center text-gray-500 text-sm w-full">
                <p>&copy; {currentYear} Tradersxauusd. All rights reserved.</p>
                <p className="text-xs mt-1">Powered by <span className="text-amber-500">AI Chart Analyst</span></p>
            </footer>
        </div>
    );
};

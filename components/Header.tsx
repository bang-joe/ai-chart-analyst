import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Logo } from './Logo';
import AdminPanel from './AdminPanel';
// --- PERBAIKAN IMPORT: Tambahkan ikon tema ---
import { LogoutIcon, AdminIcon, SunIcon, MoonIcon } from './icons'; 
// --- AKHIR PERBAIKAN IMPORT ---
import { toast } from 'react-toastify'; 
// --- TAMBAHAN BARU: Import useTheme dari App.tsx ---
import { useTheme } from '../App';
// --- AKHIR TAMBAHAN BARU ---

export const Header: React.FC = () => {
    // --- AMBIL THEME CONTEXT ---
    const { user, logout } = useAuth();
    const { theme, toggleTheme } = useTheme(); 
    // --- AKHIR AMBIL THEME CONTEXT ---
    
    const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);

    // --- FUNGSI BARU: Wrapper untuk Logout dengan Toast ---
    const handleLogout = async () => {
        try {
            await logout();
            toast.info("Anda telah berhasil logout.", {
                position: "top-right",
                autoClose: 3000,
            });
        } catch (error) {
            console.error("Logout failed:", error);
            toast.error("Gagal melakukan logout.");
        }
    };
    // --- AKHIR FUNGSI BARU ---
    
    return (
        <>
            <header className="relative text-center animate-fade-in-down py-4 border-b border-gray-700/50">
                <div className="flex flex-col items-center justify-center">
                     <div className="flex items-center justify-center gap-3 sm:gap-4">
                        <Logo className="w-10 h-10 sm:w-12 sm:h-12 text-amber-400" />
                        <h1 className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-yellow-300 pb-2">
                            AI Chart Analyst
                        </h1>
                    </div>
                    <p className="text-lg text-gray-400 mt-2">
                        Upload your trading chart and get an instant technical analysis by <span className="font-semibold text-amber-400">Tradersxauusd</span>.
                    </p>
                </div>
                 {user && (
                    <div className="absolute top-1/2 -translate-y-1/2 right-0 flex items-center space-x-3">
                         <div className="text-right hidden sm:block">
                            <p className="font-semibold text-white truncate">{user.name}</p>
                            <p className="text-xs text-gray-400 truncate">{user.email}</p>
                        </div>
                        <img 
                            src={user.picture} 
                            alt={user.name} 
                            className="w-12 h-12 rounded-full border-2 border-amber-500/50" 
                            onError={(e) => { e.currentTarget.src = `https://api.dicebear.com/8.x/initials/svg?seed=${user.name}` }}
                        />
                        <div className="flex flex-col space-y-1">
                            {/* TOMBOL THEME SWITCH BARU */}
                            <button
                                onClick={toggleTheme}
                                className="bg-gray-700/80 hover:bg-amber-600/70 text-white p-2 rounded-full transition-colors duration-300 transform hover:scale-110"
                                aria-label="Toggle Theme"
                                title="Toggle Theme"
                            >
                                <span className="w-5 h-5 block">
                                    {theme === 'dark' ? <SunIcon/> : <MoonIcon/>}
                                </span>
                            </button>
                            
                            {user.isAdmin && (
                                <button
                                    onClick={() => setIsAdminPanelOpen(true)}
                                    className="bg-gray-700/80 hover:bg-amber-600/70 text-white p-2 rounded-full transition-colors duration-300 transform hover:scale-110"
                                    aria-label="Admin Panel"
                                    title="Admin Panel"
                                >
                                    <span className="w-5 h-5 block"><AdminIcon/></span>
                                </button>
                            )}
                            <button 
                                onClick={handleLogout} 
                                className="bg-gray-700/80 hover:bg-red-600/70 text-white p-2 rounded-full transition-colors duration-300 transform hover:scale-110"
                                aria-label="Logout"
                                title="Logout"
                            >
                              <span className="w-5 h-5 block"><LogoutIcon/></span>
                            </button>
                        </div>
                    </div>
                )}
            </header>
            {isAdminPanelOpen && <AdminPanel onClose={() => setIsAdminPanelOpen(false)} />}
        </>
    );
};
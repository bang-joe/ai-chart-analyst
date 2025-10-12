// File: Header.tsx (FINAL FIX - TAMBAHKAN TOMBOL ADMIN)

import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Logo } from './Logo';
import { LogoutIcon, AdminIcon } from './icons'; // Pastikan Anda mengimpor AdminIcon
import { toast } from 'react-toastify'; 
// Hapus semua import tema yang tersisa

interface HeaderProps {
  onToggleAdmin: () => void;
  showAdminButton?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ onToggleAdmin, showAdminButton }) => {
    const { user, logout } = useAuth();
    
    // ... handleLogout tetap sama
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
    
    return (
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
                    <div className="w-12 h-12 rounded-full border-2 border-amber-500/50 bg-gray-700 flex items-center justify-center">
                         <span className="text-lg text-amber-400 font-bold">{user.name.charAt(0)}</span>
                    </div>

                    <div className="flex flex-col space-y-1">
                        {/* TOMBOL ADMIN PANEL SWITCH */}
                        {showAdminButton && (
                            <button 
                                onClick={onToggleAdmin}
                                className="bg-gray-700/80 hover:bg-blue-600/70 text-white p-2 rounded-full transition-colors duration-300 transform hover:scale-110"
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
    );
};
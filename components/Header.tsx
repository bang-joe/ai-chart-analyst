// File: Header.tsx (FINAL FIX - USER LANGSUNG DARI TABEL MEMBERS TANPA AUTH)
import React, { useEffect, useState } from 'react';
import { supabase } from '../utils/supabase-client';
import { Logo } from './Logo';
import { LogoutIcon } from './icons';
import { toast } from 'react-toastify';

interface HeaderProps {
  onOpenAdmin?: () => void;
  onLogout?: () => void; // ✅ WAJIB ADA BARIS INI
}

interface Member {
  id: string;
  name: string;
  email?: string;
  is_admin?: boolean;
  activation_code?: string;
}

export const Header: React.FC<HeaderProps> = ({ onOpenAdmin, onLogout }) => {
  const [user, setUser] = useState<Member | null>(null);

  // 🟡 Ambil data user dari Supabase (table: members)
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const savedUser = localStorage.getItem("member_user");
        if (!savedUser) return;

        const parsed = JSON.parse(savedUser);
        if (!parsed.activation_code) return;

        // Ambil data user by activation_code dari Supabase
        const { data, error } = await supabase
          .from("members")
          .select("*")
          .eq("activation_code", parsed.activation_code)
          .single();

        if (error) {
          console.warn("Gagal ambil user dari Supabase:", error.message);
          return;
        }

        setUser(data);
      } catch (err) {
        console.error("Error fetch user:", err);
      }
    };

    fetchUser();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("member_user");
    setUser(null);
    toast.info("Anda telah logout.", { position: "top-right", autoClose: 3000 });
    if (onLogout) onLogout(); // ✅ kalau App.tsx kirim handler logout, panggil juga
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
          Upload your trading chart and get an instant technical analysis by{" "}
          <span className="font-semibold text-amber-400">Tradersxauusd</span>.
        </p>
      </div>

      {user && (
        <div className="absolute top-1/2 -translate-y-1/2 right-0 flex items-center space-x-3 pr-2 sm:pr-4">
          <div className="text-right hidden sm:block">
            <p className="font-semibold text-white truncate">{user.name}</p>
            {user.email && <p className="text-xs text-gray-400 truncate">{user.email}</p>}
          </div>

          {/* Avatar */}
          <div className="w-12 h-12 rounded-full border-2 border-amber-500/50 bg-gray-700 flex items-center justify-center">
            <span className="text-lg text-amber-400 font-bold">
              {user.name ? user.name.charAt(0).toUpperCase() : "?"}
            </span>
          </div>

          {/* Tombol Admin + Logout */}
          <div className="flex flex-col space-y-1 items-center">
            {user.is_admin && (
              <button
                onClick={onOpenAdmin}
                className="bg-amber-600/90 hover:bg-amber-500 text-black font-semibold text-xs px-3 py-1 rounded-full shadow-sm transition-all"
                title="Buka Admin Panel"
              >
                Admin Panel
              </button>
            )}
            <button
              onClick={handleLogout}
              className="bg-gray-700/80 hover:bg-red-600/70 text-white p-2 rounded-full transition-all duration-300 transform hover:scale-110"
              aria-label="Logout"
              title="Logout"
            >
              <span className="w-5 h-5 block">
                <LogoutIcon />
              </span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};

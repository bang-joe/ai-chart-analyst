// File: context/AuthContext.tsx (VERSI BARU UNTUK VERCEL & SUPABASE)
import React, { createContext, useContext, useState, useEffect } from "react";
import { toast } from 'react-toastify';

// Interface User tetap sama, ini sudah bagus!
interface User {
  uid: string;
  name: string;
  email: string;
  code: string;
  isAdmin: boolean;
  isActive: boolean;
  membership: string;
  planType: string;
  joinDate: string;
  expDate: string | null;
  lastLogin?: string;
  region?: string;
  picture?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, code: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true, // Default loading ke true
  login: async () => {},
  logout: () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Cek session dari localStorage saat aplikasi pertama kali dimuat
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem("authUser");
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error("Gagal parse user dari localStorage", error);
      localStorage.removeItem("authUser");
    } finally {
      setLoading(false);
    }
  }, []);

  const login = async (email: string, code: string) => {
    try {
      // 1. KIRIM PERMINTAAN LOGIN KE BACKEND VERCEL KITA
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, activationCode: code }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Jika server mengembalikan error (misal: 401, 403, 500), lempar error dengan pesan dari server
        throw new Error(data.message || 'Login gagal.');
      }
      
      const userData: User = data.user;

      // 2. SET SESSION DAN RELOAD
      localStorage.setItem("authUser", JSON.stringify(userData));
      setUser(userData);
      toast.success("Login berhasil!");
      window.location.reload(); 

    } catch (error: any) {
      console.error("Login failed:", error);
      // Tampilkan pesan error yang dilempar dari server atau logic di atas
      throw new Error(error.message || "Terjadi kesalahan. Coba lagi.");
    }
  };

  const logout = () => {
    // Logout di Vercel/Supabase hanya perlu membersihkan session di sisi client
    localStorage.removeItem("authUser");
    setUser(null);
    toast.info("Anda telah berhasil logout.");
    window.location.reload(); 
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
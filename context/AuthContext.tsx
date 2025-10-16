// File: context/AuthContext.tsx (FINAL FIX UNTUK ADMIN PANEL)
import React, { createContext, useContext, useState, useEffect } from "react";
import { toast } from 'react-toastify';

// ✅ Interface User (tidak diubah)
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
  loading: true,
  login: async () => {},
  logout: () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // 🧩 Load session dari localStorage
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem("authUser");
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser) as User;

        // ✅ Tambahkan fallback isAdmin jika backend belum mengirim flag
        const withAdminFlag = {
          ...parsedUser,
          isAdmin:
            parsedUser.isAdmin ||
            parsedUser.email === "joeuma929@gmail.com" || // hardcoded superadmin
            parsedUser.planType === "ADMIN" ||             // auto-detect dari plan
            parsedUser.membership === "Lifetime Access",   // backup auto-admin
        };

        setUser(withAdminFlag);
      }
    } catch (error) {
      console.error("❌ Gagal parse user dari localStorage:", error);
      localStorage.removeItem("authUser");
    } finally {
      setLoading(false);
    }
  }, []);

  // 🧠 Login
  const login = async (email: string, code: string) => {
    try {
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, activationCode: code }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login gagal.');
      }

      const userData: User = data.user;

      // ✅ Tambahkan flag admin kalau planType atau email cocok
      const finalUser: User = {
        ...userData,
        isAdmin:
          userData.isAdmin ||
          userData.email === "joeuma929@gmail.com" ||
          userData.planType === "ADMIN" ||
          userData.membership === "Lifetime Access",
      };

      localStorage.setItem("authUser", JSON.stringify(finalUser));
      setUser(finalUser);
      toast.success("✅ Login berhasil!");
      window.location.reload();

    } catch (error: any) {
      console.error("Login failed:", error);
      toast.error(error.message || "Terjadi kesalahan saat login.");
      throw new Error(error.message || "Terjadi kesalahan saat login.");
    }
  };

  // 🚪 Logout
  const logout = () => {
    localStorage.removeItem("authUser");
    setUser(null);
    toast.info("Anda telah logout.");
    window.location.reload();
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
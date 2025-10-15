// File: context/AuthContext.tsx (FINAL FIX – Auto Session, No Blank, Admin Safe)
import React, { createContext, useContext, useState, useEffect } from "react";
import { toast } from "react-toastify";
import { supabase } from "../utils/supabase-client";
import type { AuthChangeEvent, Session } from "@supabase/supabase-js";

// ✅ Struktur user tidak diubah
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

  // ✅ Auto load session Supabase (biar gak blank screen)
  useEffect(() => {
    const initSession = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        const sessionUser = data?.session?.user;

        if (sessionUser) {
          const local = localStorage.getItem("authUser");
          const parsed = local ? JSON.parse(local) : {};

          const mergedUser = {
            ...parsed,
            email: sessionUser.email,
            uid: sessionUser.id,
          };

          localStorage.setItem("authUser", JSON.stringify(mergedUser));
          setUser(mergedUser);
        }
      } catch (err) {
        console.error("❌ Gagal ambil session Supabase:", err);
      } finally {
        setLoading(false);
      }
    };

    initSession();

    // 🧠 Listener perubahan login/logout dari Supabase
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event: AuthChangeEvent, session: Session | null) => {
        if (session?.user) {
          const u = {
            email: session.user.email,
            uid: session.user.id,
          };
          localStorage.setItem("authUser", JSON.stringify(u));
          setUser(u as any);
        } else {
          localStorage.removeItem("authUser");
          setUser(null);
        }
        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // 🧩 Load dari localStorage untuk auto-login
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem("authUser");
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser) as User;
        const withAdminFlag = {
          ...parsedUser,
          isAdmin:
            parsedUser.isAdmin ||
            parsedUser.email === "joeuma929@gmail.com" || // superadmin
            parsedUser.planType === "ADMIN" ||
            parsedUser.membership === "Lifetime Access",
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

  // 🔑 Login
  const login = async (email: string, code: string) => {
    try {
      const response = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, activationCode: code }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Login gagal.");

      const userData: User = data.user;
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

  // 🌀 Fallback UI agar gak blank waktu loading
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900 text-gray-300">
        <div className="animate-pulse text-lg font-semibold">
          🔄 Memuat aplikasi...
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

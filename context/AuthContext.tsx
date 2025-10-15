// File: context/AuthContext.tsx (FINAL FIX – Auto Sync + Persist Login State)
import React, { createContext, useContext, useState, useEffect } from "react";
import { toast } from "react-toastify";
import { supabase } from "../utils/supabase-client";
import type { AuthChangeEvent, Session } from "@supabase/supabase-js";

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

  // 🧠 Sync session Supabase → React state + localStorage
  useEffect(() => {
    const init = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        const session = data?.session;

        if (session?.user) {
          const existing = localStorage.getItem("authUser");
          const merged = existing ? JSON.parse(existing) : {};

          const sessionUser = {
            ...merged,
            uid: session.user.id,
            email: session.user.email,
          };

          localStorage.setItem("authUser", JSON.stringify(sessionUser));
          setUser(sessionUser as User);
        } else {
          const storedUser = localStorage.getItem("authUser");
          if (storedUser) setUser(JSON.parse(storedUser));
        }
      } catch (err) {
        console.error("❌ Session init error:", err);
      } finally {
        setLoading(false);
      }
    };

    init();

    // 🔄 Listen Supabase auth state change
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event: AuthChangeEvent, session: Session | null) => {
        if (session?.user) {
          const sessionUser = {
            uid: session.user.id,
            email: session.user.email,
          };
          localStorage.setItem("authUser", JSON.stringify(sessionUser));
          setUser(sessionUser as User);
        } else {
          localStorage.removeItem("authUser");
          setUser(null);
        }
      }
    );

    return () => listener.subscription.unsubscribe();
  }, []);

  // ✅ Restore local user untuk auto-login
  useEffect(() => {
    const restore = async () => {
      const stored = localStorage.getItem("authUser");
      if (stored) {
        const parsed = JSON.parse(stored);
        const adminUser = {
          ...parsed,
          isAdmin:
            parsed.isAdmin ||
            parsed.email === "joeuma929@gmail.com" ||
            parsed.planType === "ADMIN" ||
            parsed.membership === "Lifetime Access",
        };
        setUser(adminUser);
      }
      setLoading(false);
    };

    // Delay kecil agar Supabase client siap dulu
    const timer = setTimeout(restore, 400);
    return () => clearTimeout(timer);
  }, []);

  // 🔑 Login handler
  const login = async (email: string, code: string) => {
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, activationCode: code }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Login gagal.");

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
    } catch (error: any) {
      console.error("Login failed:", error);
      toast.error(error.message || "Terjadi kesalahan saat login.");
      throw new Error(error.message || "Terjadi kesalahan saat login.");
    }
  };

  // 🚪 Logout handler
  const logout = () => {
    localStorage.removeItem("authUser");
    setUser(null);
    toast.info("Anda telah logout.");
    supabase.auth.signOut();
  };

  // 🌀 Anti-blank loading screen
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900 text-gray-400">
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

// File: context/AuthContext.tsx (FINAL STABLE VERSION)
import React, { createContext, useContext, useState, useEffect } from "react";
import { toast } from "react-toastify";

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

  useEffect(() => {
    const storedUser = localStorage.getItem("authUser");
    if (storedUser) {
      const parsed = JSON.parse(storedUser);
      parsed.isAdmin =
        parsed.isAdmin ||
        parsed.email === "joeuma929@gmail.com" ||
        parsed.planType === "ADMIN" ||
        parsed.membership === "Lifetime Access";
      setUser(parsed);
    }
    setLoading(false);
  }, []);

  const login = async (email: string, code: string) => {
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, activationCode: code }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Login gagal");

      const userData: User = data.user;
      userData.isAdmin =
        userData.isAdmin ||
        userData.email === "joeuma929@gmail.com" ||
        userData.planType === "ADMIN" ||
        userData.membership === "Lifetime Access";

      localStorage.setItem("authUser", JSON.stringify(userData));
      setUser(userData);
      toast.success("✅ Login berhasil!");
      window.location.reload();
    } catch (err: any) {
      toast.error(err.message || "Login gagal.");
    }
  };

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

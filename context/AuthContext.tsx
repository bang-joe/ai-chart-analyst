import React, { createContext, useContext, useState, useEffect } from "react";
// Pastikan path ke userService sudah benar
import { getUserByEmail } from "../services/userService"; 
import { getAuth, signInWithEmailAndPassword, signOut } from "firebase/auth";
// Import 'app' dan 'db' dari firebaseConfig
import app, { auth, db } from "../services/firebaseConfig.ts"; // <-- Import auth & db
import { toast } from 'react-toastify';
import { ref, update } from "firebase/database"; // Import ref dan update untuk RTDB

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
  loading: false,
  login: async () => {},
  logout: () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const authInstance = auth; // Menggunakan auth yang di-export dari firebaseConfig

  useEffect(() => {
    const storedUser = localStorage.getItem("authUser");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = async (email: string, code: string) => {
    try {
      // 1. SIGN-IN KE FIREBASE AUTH
      const userCredential = await signInWithEmailAndPassword(authInstance, email, code);
      const authUid = userCredential.user.uid; 

      // --- PERBAIKAN KRITIS UNTUK "PERMISSION DENIED" ---
      // Ini memaksa token Auth segera aktif dan siap digunakan RTDB.
      await userCredential.user.getIdToken(true); 
      // --- AKHIR PERBAIKAN KRITIS ---

      // 2. AMBIL DATA USER DARI RTDB
      const userData = await getUserByEmail(email);

      // 3. VERIFIKASI USER DATA DAN STATUS AKTIF
      if (!userData || userData.uid !== authUid) {
        await signOut(authInstance);
        throw new Error("Verifikasi akun gagal: Data pengguna tidak ditemukan di database.");
      }

      if (!userData.isActive) {
        await signOut(authInstance);
        throw new Error("Akun belum aktif. Hubungi admin.");
      }
      if (userData.expDate && new Date(userData.expDate) < new Date()) {
        await signOut(authInstance);
        throw new Error("Masa aktif akun telah habis.");
      }
      
      // 4. UPDATE WAKTU LOGIN TERAKHIR DI RTDB
      const userRef = ref(db, `users/${authUid}`);
      await update(userRef, {
          lastLogin: new Date().toISOString().slice(0, 19).replace('T', ' ')
      });

      // 5. SET SESSION DAN RELOAD
      localStorage.setItem("authUser", JSON.stringify(userData));
      setUser(userData);
      toast.success("Login berhasil!");
      window.location.reload(); 

    } catch (error: any) {
      console.error("Login failed:", error);
      
      if (error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found') {
        throw new Error("Email atau Kode Aktivasi salah.");
      } else if (error.message.includes('Permission denied')) {
        throw new Error("Login gagal: Masalah perizinan database. Pastikan Rules RTDB sudah 'Publish' dengan benar.");
      } else {
        throw new Error("Login gagal. Coba lagi atau hubungi admin. (Error Code: " + (error.code || "unknown") + ")");
      }
    }
  };

  const logout = async () => {
    try {
      await signOut(authInstance);
      localStorage.removeItem("authUser");
      setUser(null);
      toast.info("Anda telah berhasil logout.");
      window.location.reload(); 
    } catch (error) {
      console.error("Logout failed:", error);
      toast.error("Gagal logout. Silakan coba lagi.");
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
// File: components/AdminPanel.tsx (FINAL FIXED VERSION - SESSION SYNC + NO ADMIN LOGS)

import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import { supabase } from "../utils/supabase-client"; // ✅ gunakan instance Supabase utama

interface User {
  id: number;
  uid: string;
  name: string;
  email: string;
  activation_code: string;
  is_admin: boolean;
  is_active: boolean;
  membership_type: string;
  plan_type: string;
  join_date: string;
  membership_expires_at: string | null;
  last_login?: string;
  picture_url?: string;
}

interface AdminPanelProps {
  onClose: () => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ onClose }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    activation_code: "",
    membership_type: "Lifetime Access",
    plan_type: "ADMIN",
    is_admin: true,
    is_active: true,
    uid: crypto.randomUUID(),
    join_date: new Date().toISOString(),
    membership_expires_at: null,
  });

  // ✅ Pantau perubahan session Supabase (biar gak logout random)
  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "TOKEN_REFRESHED") {
        console.log("🔁 Token admin diperbarui otomatis.");
      }
      if (event === "SIGNED_OUT" || !session) {
        toast.error("⚠️ Sesi kadaluarsa. Silakan login ulang.");
        onClose();
      }
    });
    return () => listener.subscription.unsubscribe();
  }, [onClose]);

  // ✅ Verifikasi hanya admin bisa buka panel ini
  const verifyAdmin = useCallback(async () => {
    const { data, error } = await supabase.auth.getUser();

    if (error || !data?.user) {
      toast.error("⚠️ Sesi kadaluarsa. Silakan login ulang.");
      onClose();
      return false;
    }

    const { data: member, error: err2 } = await supabase
      .from("members")
      .select("is_admin")
      .eq("email", data.user.email)
      .maybeSingle();

    if (err2 || !member?.is_admin) {
      toast.error("🚫 Akses ditolak. Hanya admin yang dapat mengelola data.");
      onClose();
      return false;
    }

    return true;
  }, [onClose]);

  // 🔁 Ambil semua user
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    const isAllowed = await verifyAdmin();
    if (!isAllowed) return;

    const { data, error } = await supabase
      .from("members")
      .select(
        "id, uid, name, email, activation_code, is_admin, is_active, membership_type, plan_type, join_date, membership_expires_at"
      )
      .order("id", { ascending: false });

    if (error) {
      toast.error("Gagal mengambil data user: " + error.message);
      setUsers([]);
    } else {
      setUsers(data as User[]);
    }
    setLoading(false);
  }, [verifyAdmin]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // ➕ Tambah User
  const handleAddUser = async () => {
    const isAllowed = await verifyAdmin();
    if (!isAllowed) return;

    if (!newUser.name || !newUser.email || !newUser.activation_code) {
      toast.warn("⚠️ Nama, Email, dan Kode wajib diisi!");
      return;
    }

    const { error } = await supabase.from("members").insert([{ ...newUser }]);
    if (error) {
      toast.error("❌ Gagal menambahkan user: " + error.message);
    } else {
      toast.success("✅ User berhasil ditambahkan!");
      setNewUser({
        name: "",
        email: "",
        activation_code: "",
        membership_type: "Lifetime Access",
        plan_type: "ADMIN",
        is_admin: true,
        is_active: true,
        uid: crypto.randomUUID(),
        join_date: new Date().toISOString(),
        membership_expires_at: null,
      });
      fetchUsers();
    }
  };

  // 🗑️ Hapus User
  const handleDeleteUser = async (id: number) => {
    const isAllowed = await verifyAdmin();
    if (!isAllowed) return;

    if (!confirm("Yakin ingin menghapus user ini? Aksi ini tidak bisa dibatalkan.")) return;
    const { error } = await supabase.from("members").delete().eq("id", id);
    if (error) {
      toast.error("❌ Gagal menghapus user: " + error.message);
    } else {
      toast.success("🗑️ User berhasil dihapus.");
      fetchUsers();
    }
  };

  // 🔁 Toggle admin/aktif
  const handleToggleField = async (
    id: number,
    field: "is_admin" | "is_active",
    currentValue: boolean
  ) => {
    const isAllowed = await verifyAdmin();
    if (!isAllowed) return;

    const { error } = await supabase
      .from("members")
      .update({ [field]: !currentValue })
      .eq("id", id);

    if (error) {
      toast.error("❌ Gagal memperbarui status user.");
    } else {
      toast.success(`✅ Status ${field} berhasil diubah!`);
      fetchUsers();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/70 backdrop-blur-md flex justify-center items-center z-50 p-4 overflow-y-auto"
    >
      <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-6xl shadow-lg relative text-gray-200">
        {/* ✳️ Tombol Close Panel */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-300 hover:text-white text-xl font-bold bg-gray-800/80 px-3 py-1 rounded-lg"
        >
          ← Back to App
        </button>

        <h2 className="text-2xl font-bold mb-6 text-white text-center">
          Admin Panel – User Management
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* ADD USER */}
          <div className="bg-gray-800/50 rounded-xl p-5 border border-gray-700">
            <h3 className="text-lg font-semibold mb-4 text-amber-400">
              Add New User
            </h3>
            <input
              type="text"
              placeholder="Name"
              value={newUser.name}
              onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
              className="w-full bg-gray-900 border border-gray-700 text-white rounded-lg px-3 py-2 mb-3"
            />
            <input
              type="email"
              placeholder="Email"
              value={newUser.email}
              onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
              className="w-full bg-gray-900 border border-gray-700 text-white rounded-lg px-3 py-2 mb-3"
            />
            <input
              type="text"
              placeholder="Activation Code"
              value={newUser.activation_code}
              onChange={(e) =>
                setNewUser({ ...newUser, activation_code: e.target.value })
              }
              className="w-full bg-gray-900 border border-gray-700 text-white rounded-lg px-3 py-2 mb-3"
            />
            <button
              onClick={handleAddUser}
              className="w-full bg-amber-600 hover:bg-amber-700 text-white py-2 rounded-lg font-bold shadow-md"
            >
              Add User
            </button>
          </div>

          {/* USER LIST */}
          <div className="bg-gray-800/50 rounded-xl p-5 border border-gray-700">
            <h3 className="text-lg font-semibold mb-4 text-amber-400">
              Existing Users ({users.length})
            </h3>
            {loading ? (
              <p className="text-gray-400 italic">Loading users...</p>
            ) : users.length === 0 ? (
              <p className="text-gray-500 italic">No users found.</p>
            ) : (
              <div className="space-y-3 max-h-[500px] overflow-y-auto">
                {users.map((u) => (
                  <div
                    key={u.id}
                    className="flex justify-between items-center bg-gray-900 px-3 py-2 rounded-lg border border-gray-700"
                  >
                    <div>
                      <p className="font-semibold text-white">{u.name}</p>
                      <p className="text-sm text-gray-400">{u.email}</p>
                    </div>
                    <div className="flex gap-2 items-center">
                      <button
                        onClick={() =>
                          handleToggleField(u.id, "is_admin", u.is_admin)
                        }
                        className={`px-3 py-1 rounded-md text-xs font-bold ${
                          u.is_admin ? "bg-blue-600" : "bg-gray-600"
                        }`}
                      >
                        {u.is_admin ? "Admin" : "User"}
                      </button>
                      <button
                        onClick={() =>
                          handleToggleField(u.id, "is_active", u.is_active)
                        }
                        className={`px-3 py-1 rounded-md text-xs font-bold ${
                          u.is_active ? "bg-green-600" : "bg-red-600"
                        }`}
                      >
                        {u.is_active ? "Active" : "Inactive"}
                      </button>
                      <button
                        onClick={() => handleDeleteUser(u.id)}
                        className="px-3 py-1 bg-red-700 hover:bg-red-800 rounded-md text-xs font-bold"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default AdminPanel;

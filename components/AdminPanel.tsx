import React, { useState, useEffect } from "react";
import { ref, onValue, update, remove, push } from "firebase/database";
import { db } from "../services/firebaseConfig";
import { motion } from "framer-motion";

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

interface AdminPanelProps {
  onClose: () => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ onClose }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [newUser, setNewUser] = useState<Partial<User>>({
    name: "",
    email: "",
    code: "",
    membership: "Free",
    planType: "Trial",
    isAdmin: false,
    isActive: true,
  });

  // 🔁 Realtime listener untuk users
  useEffect(() => {
    const usersRef = ref(db, "users");
    const unsubscribe = onValue(usersRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const userList = Object.entries(data).map(([uid, value]: any) => ({
          uid,
          ...value,
        }));
        setUsers(userList);
      } else {
        setUsers([]);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // ➕ Tambah user baru
  const handleAddUser = async () => {
    if (!newUser.name || !newUser.email || !newUser.code) {
      alert("⚠️ Nama, Email, dan Kode wajib diisi!");
      return;
    }

    try {
      const usersRef = ref(db, "users");
      const newUserRef = push(usersRef);
      const now = new Date();

      await update(newUserRef, {
        uid: newUserRef.key,
        name: newUser.name,
        email: newUser.email,
        code: newUser.code,
        isAdmin: newUser.isAdmin ?? false,
        isActive: newUser.isActive ?? true,
        membership: newUser.membership ?? "Free",
        planType: newUser.planType ?? "Trial",
        joinDate: now.toISOString(),
        expDate: null,
        region: newUser.region ?? "",
        picture: newUser.picture ?? "",
      });

      setNewUser({
        name: "",
        email: "",
        code: "",
        membership: "Free",
        planType: "Trial",
        isAdmin: false,
        isActive: true,
      });

      alert("✅ User berhasil ditambahkan!");
    } catch (err) {
      console.error("Error adding user:", err);
      alert("❌ Gagal menambahkan user.");
    }
  };

  // ❌ Hapus user
  const handleDeleteUser = async (uid: string) => {
    if (!confirm("Yakin ingin menghapus user ini?")) return;
    try {
      await remove(ref(db, `users/${uid}`));
      alert("🗑️ User berhasil dihapus.");
    } catch (err) {
      console.error("Error deleting user:", err);
      alert("❌ Gagal menghapus user.");
    }
  };

  // 🔄 Toggle Admin / Active
  const handleToggleField = async (
    uid: string,
    field: "isAdmin" | "isActive",
    current: boolean
  ) => {
    try {
      await update(ref(db, `users/${uid}`), { [field]: !current });
      alert(
        `✅ ${field === "isAdmin" ? "Status Admin" : "Status Aktif"} diubah menjadi ${
          !current ? "Aktif" : "Nonaktif"
        }`
      );
    } catch (err) {
      console.error("Error toggling field:", err);
      alert("❌ Gagal memperbarui data user.");
    }
  };

  // 🔁 Update membership plan
  const handleUpdateMembership = async (uid: string, newPlan: string) => {
    try {
      await update(ref(db, `users/${uid}`), { membership: newPlan });
      alert(`🎟️ Membership user diubah menjadi ${newPlan}`);
    } catch (err) {
      console.error("Error updating membership:", err);
      alert("❌ Gagal update membership.");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/70 backdrop-blur-md flex justify-center items-center z-50"
    >
      <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-6xl shadow-lg relative text-gray-200">
        {/* ✖️ Close Button */}
        <button
          onClick={() => {
            onClose();
            setTimeout(() => window.scrollTo(0, 0), 150);
          }}
          className="absolute top-4 right-4 text-gray-400 hover:text-white text-2xl font-bold"
        >
          ×
        </button>

        <h2 className="text-2xl font-bold mb-6 text-white">
          Admin Panel – User Management
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* ➕ Add User */}
          <div className="bg-gray-800/50 rounded-xl p-5 border border-gray-700">
            <h3 className="text-lg font-semibold mb-4 text-amber-400">
              Add New User
            </h3>
            <input
              type="text"
              placeholder="Name"
              value={newUser.name || ""}
              onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
              className="w-full bg-gray-900 border border-gray-700 text-white rounded-lg px-3 py-2 mb-3"
            />
            <input
              type="email"
              placeholder="Email"
              value={newUser.email || ""}
              onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
              className="w-full bg-gray-900 border border-gray-700 text-white rounded-lg px-3 py-2 mb-3"
            />
            <input
              type="text"
              placeholder="Activation Code"
              value={newUser.code || ""}
              onChange={(e) => setNewUser({ ...newUser, code: e.target.value })}
              className="w-full bg-gray-900 border border-gray-700 text-white rounded-lg px-3 py-2 mb-3"
            />
            <select
              value={newUser.membership}
              onChange={(e) =>
                setNewUser({ ...newUser, membership: e.target.value })
              }
              className="w-full bg-gray-900 border border-gray-700 text-white rounded-lg px-3 py-2 mb-3"
            >
              <option value="Free">Free</option>
              <option value="Premium">Premium</option>
              <option value="VIP">VIP</option>
            </select>
            <button
              onClick={handleAddUser}
              className="w-full bg-amber-600 hover:bg-amber-700 text-white py-2 rounded-lg font-bold shadow-md"
            >
              Add User
            </button>
          </div>

          {/* 👥 User List */}
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
                    key={u.uid}
                    className="flex justify-between items-center bg-gray-900 px-3 py-2 rounded-lg border border-gray-700"
                  >
                    <div>
                      <p className="font-semibold text-white">{u.name}</p>
                      <p className="text-sm text-gray-400">{u.email}</p>
                      <p className="text-xs text-gray-500">
                        Code: {u.code} | Plan: {u.membership}
                      </p>
                      <p className="text-xs text-gray-600">
                        Join: {u.joinDate ? new Date(u.joinDate).toLocaleDateString() : ""}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleToggleField(u.uid, "isAdmin", u.isAdmin)}
                        className={`px-3 py-1 rounded-md text-xs font-bold ${
                          u.isAdmin ? "bg-blue-600" : "bg-gray-600"
                        }`}
                      >
                        {u.isAdmin ? "Admin" : "User"}
                      </button>
                      <button
                        onClick={() => handleToggleField(u.uid, "isActive", u.isActive)}
                        className={`px-3 py-1 rounded-md text-xs font-bold ${
                          u.isActive ? "bg-green-600" : "bg-red-600"
                        }`}
                      >
                        {u.isActive ? "Active" : "Inactive"}
                      </button>
                      <select
                        value={u.membership}
                        onChange={(e) =>
                          handleUpdateMembership(u.uid, e.target.value)
                        }
                        className="bg-gray-800 text-white text-xs rounded-md border border-gray-600 px-2 py-1"
                      >
                        <option value="Free">Free</option>
                        <option value="Premium">Premium</option>
                        <option value="VIP">VIP</option>
                      </select>
                      <button
                        onClick={() => handleDeleteUser(u.uid)}
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





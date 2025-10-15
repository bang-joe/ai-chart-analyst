// File: components/AdminLogs.tsx (FINAL STABLE + SECURE PRODUCTION VERSION)
// ✨ Menampilkan riwayat aktivitas admin dari Supabase (insert, update, delete)

import React, { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import { supabase } from "../utils/supabase-client"; // ✅ gunakan client tunggal dari utils

interface LogEntry {
  id: number;
  action: string;
  target_email: string | null;
  performed_by: string;
  performed_at: string;
  details?: Record<string, any>;
}

const AdminLogs: React.FC = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = useCallback(async () => {
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from("admin_logs")
        .select("*")
        .order("performed_at", { ascending: false })
        .limit(50);

      if (error) {
        console.error("❌ Gagal fetch admin logs:", error.message);
        toast.error("Gagal mengambil log aktivitas admin.");
        setLogs([]);
      } else {
        setLogs(data as LogEntry[]);
      }
    } catch (err) {
      console.error("❌ Error jaringan/fetch:", err);
      toast.error("Gagal menghubungi server log.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // 🔄 Auto refresh setiap 20 detik
  useEffect(() => {
    const interval = setInterval(fetchLogs, 20000);
    return () => clearInterval(interval);
  }, [fetchLogs]);

  const getActionColor = (action: string) => {
    switch (action?.toUpperCase()) {
      case "INSERT":
        return "text-green-400";
      case "UPDATE":
        return "text-yellow-400";
      case "DELETE":
        return "text-red-400";
      default:
        return "text-gray-300";
    }
  };

  return (
    <motion.div
      className="bg-gray-900 border border-gray-700 rounded-2xl p-6 mt-8 text-gray-200 shadow-xl"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <h2 className="text-2xl font-bold text-amber-400 mb-4 text-center">
        🧾 Admin Activity Logs
      </h2>

      {loading ? (
        <p className="text-gray-400 text-center italic">Loading logs...</p>
      ) : logs.length === 0 ? (
        <p className="text-gray-500 text-center italic">
          Belum ada aktivitas admin tercatat.
        </p>
      ) : (
        <div className="overflow-x-auto max-h-[500px] overflow-y-auto rounded-lg border border-gray-800">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-800 text-gray-300 sticky top-0">
              <tr>
                <th className="px-4 py-2 text-left">Waktu</th>
                <th className="px-4 py-2 text-left">Aksi</th>
                <th className="px-4 py-2 text-left">Target</th>
                <th className="px-4 py-2 text-left">Admin</th>
                <th className="px-4 py-2 text-left">Detail</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr
                  key={log.id}
                  className="border-b border-gray-800 hover:bg-gray-800/60 transition-all"
                >
                  <td className="px-4 py-2 text-gray-400 whitespace-nowrap">
                    {new Date(log.performed_at).toLocaleString()}
                  </td>
                  <td
                    className={`px-4 py-2 font-bold ${getActionColor(
                      log.action
                    )}`}
                  >
                    {log.action}
                  </td>
                  <td className="px-4 py-2 text-gray-300">
                    {log.target_email || "-"}
                  </td>
                  <td className="px-4 py-2 text-gray-400">
                    {log.performed_by}
                  </td>
                  <td className="px-4 py-2 text-gray-500 max-w-[300px] truncate">
                    {log.details?.table
                      ? `${log.details.table} (${Object.keys(
                          log.details.new_data || {}
                        ).length} fields)`
                      : "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-6 flex justify-center">
        <button
          onClick={fetchLogs}
          className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg font-semibold shadow-lg transition-all"
        >
          🔄 Refresh Logs
        </button>
      </div>
    </motion.div>
  );
};

export default AdminLogs;

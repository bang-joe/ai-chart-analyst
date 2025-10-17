// File: /components/AnalysisHistory.tsx
import React, { useEffect, useState } from "react";
import { Loader } from "./Loader";
import { motion } from "framer-motion";
import { toast } from "react-toastify";

interface AnalysisHistoryProps {
  user_uid: string;
  onLoadAnalysis?: (analysis: any) => void;
}

interface AnalysisRecord {
  id: string;
  pair: string;
  timeframe: string;
  risk: string;
  ai_text: string;
  created_at: string;
  parsed_json?: any;
}

export const AnalysisHistory: React.FC<AnalysisHistoryProps> = ({
  user_uid,
  onLoadAnalysis,
}) => {
  const [analyses, setAnalyses] = useState<AnalysisRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<AnalysisRecord | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`/api/get-analyses?user_uid=${user_uid}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Gagal memuat data.");
        setAnalyses(data.analyses);
      } catch (err) {
        console.error(err);
        setError("Gagal memuat riwayat analisa.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user_uid]);

  const handleDelete = async (id: string) => {
    if (!confirm("Yakin mau hapus analisa ini?")) return;
    try {
      const res = await fetch(`/api/delete-analysis?id=${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal menghapus.");
      setAnalyses((prev) => prev.filter((a) => a.id !== id));
      toast.success("Analisa berhasil dihapus!");
    } catch (err) {
      console.error(err);
      toast.error("Gagal menghapus analisa.");
    }
  };

  if (loading)
    return (
      <div className="flex justify-center items-center py-12">
        <Loader />
      </div>
    );

  if (error)
    return (
      <div className="text-red-400 text-center bg-red-900/30 p-4 rounded-xl shadow-lg">
        {error}
      </div>
    );

  if (analyses.length === 0)
    return (
      <div className="text-gray-400 text-center py-8">
        Belum ada analisa tersimpan.
      </div>
    );

  // ✅ RETURN UTAMA (FIXED JSX)
  return (
    <div className="bg-gray-800/40 border border-gray-700 p-6 rounded-2xl shadow-lg mt-8">
      <h2 className="text-xl font-semibold text-white mb-4">
        📜 Riwayat
      </h2>

      <div className="space-y-4">
        {analyses.map((a) => (
          <motion.div
            key={a.id}
            whileHover={{ scale: 1.02 }}
            className="bg-gray-900/60 border border-gray-700 p-4 rounded-xl flex justify-between items-center"
          >
            <div>
              <h3 className="text-amber-400 font-bold">
                {a.pair} ({a.timeframe})
              </h3>
              <p className="text-sm text-gray-400">
                Risiko: {a.risk} •{" "}
                {new Date(a.created_at).toLocaleString("id-ID", {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setSelected(a)}
                className="px-3 py-1 rounded-lg bg-gray-700 hover:bg-gray-600 text-white font-semibold"
              >
                Lihat
              </button>
              <button
                onClick={() => onLoadAnalysis && onLoadAnalysis(a)}
                className="px-3 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-semibold"
              >
                Buka Ulang
              </button>
              <button
                onClick={() => handleDelete(a.id)}
                className="px-3 py-1 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold"
              >
                Hapus
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* 🟡 Modal Detail (Z-index tinggi biar gak ketimpa disclaimer) */}
      {selected && (
  <div
    className="absolute inset-x-0 top-0 bottom-24 flex items-center justify-center z-[9999]" 
    style={{
      backgroundColor: "rgba(0, 0, 0, 0.45)",
      backdropFilter: "blur(6px)",
    }}
    onClick={() => setSelected(null)}
  >
    <div
      className="relative bg-gray-900 rounded-xl p-6 w-[90%] sm:w-full max-w-2xl shadow-2xl border border-gray-700 overflow-y-auto max-h-[80vh]"
      onClick={(e) => e.stopPropagation()}
      style={{
        boxShadow: "0 0 40px rgba(0,0,0,0.4)",
        transform: "translateY(0)",
        transition: "all 0.2s ease",
      }}
    >
      <button
        onClick={() => setSelected(null)}
        className="absolute top-3 right-3 text-gray-400 hover:text-white text-lg"
      >
        ✕
      </button>

      <h3 className="text-amber-400 font-bold text-lg mb-2">
        {selected.pair} ({selected.timeframe})
      </h3>

      <p className="text-sm text-gray-400 mb-4">
        Dibuat pada {new Date(selected.created_at).toLocaleString("id-ID")}
      </p>

      <div className="text-gray-200 whitespace-pre-line text-sm leading-relaxed bg-gray-800/60 border border-gray-700 p-4 rounded-xl overflow-y-auto max-h-[65vh]">
        {selected.ai_text}
      </div>
    </div>
  </div>
)}
    </div>
  );
};

import React, { useState, useEffect } from "react";
import { supabaseTestimonials } from "../lib/supabase";
import { toast } from "react-toastify";

interface Props {
  userEmail: string;
}

const TestimonialForm: React.FC<Props> = ({ userEmail }) => {
  const [text, setText] = useState("");
  const [rating, setRating] = useState(5);
  const [loading, setLoading] = useState(false);
  const [hasTestimonial, setHasTestimonial] = useState(false);

  // 🔍 Cek apakah user sudah pernah kirim testimoni
  useEffect(() => {
    const checkExisting = async () => {
      const { data, error } = await supabaseTestimonials
        .from("testimonials")
        .select("id")
        .eq("author", userEmail)
        .limit(1);
      if (error) console.error(error);
      if (data && data.length > 0) setHasTestimonial(true);
    };
    checkExisting();
  }, [userEmail]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return toast.error("Isi dulu testimoninya, Bro!");

    try {
      setLoading(true);
      const { error } = await supabaseTestimonials.from("testimonials").insert([
        {
          author: userEmail,
          text,
          rating,
          created_at: new Date().toISOString(),
        },
      ]);

      if (error) throw error;

      toast.success("✅ Testimoni berhasil dikirim!");
      setText("");
      setHasTestimonial(true);
    } catch (err: any) {
      toast.error("❌ Gagal kirim testimoni: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (hasTestimonial) {
    return (
      <div className="bg-gray-800/70 p-4 rounded-xl shadow-md mt-8 max-w-md mx-auto text-center">
        <p className="text-gray-300 italic">
          Kamu sudah kirim testimoni, terima kasih 🙏
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-gray-800/70 p-5 rounded-2xl shadow-md mt-8 max-w-lg mx-auto"
    >
      <h3 className="text-amber-400 text-lg font-semibold mb-3 text-center">
        Kirim Testimoni Kamu
      </h3>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Tulis pengalaman kamu di sini..."
        className="w-full p-3 rounded-md bg-gray-900 text-gray-100 outline-none focus:ring-2 focus:ring-amber-400"
        rows={3}
      />

      <div className="flex items-center justify-between mt-3">
        <label className="text-gray-300 text-sm">Rating:</label>
        <select
          value={rating}
          onChange={(e) => setRating(parseInt(e.target.value))}
          className="bg-gray-700 text-gray-100 rounded-md px-2 py-1 focus:outline-none"
        >
          {[1, 2, 3, 4, 5].map((r) => (
            <option key={r} value={r}>
              {r} ⭐
            </option>
          ))}
        </select>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-amber-500 hover:bg-amber-400 text-gray-900 font-semibold py-2 mt-4 rounded-md transition-all"
      >
        {loading ? "Mengirim..." : "Kirim Testimoni"}
      </button>
    </form>
  );
};

export default TestimonialForm;

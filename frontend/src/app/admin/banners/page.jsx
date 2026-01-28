"use client";

import { useState } from "react";
import { Image as ImageIcon, Upload } from "lucide-react";
import { motion } from "framer-motion";

export default function AdminBannersPage() {
  const [loadingBanner, setLoadingBanner] = useState(false);
  const [loadingHero, setLoadingHero] = useState(false);

  const [previewBanner, setPreviewBanner] = useState(null);
  const [previewHero, setPreviewHero] = useState(null);

  // ===========================
  // HERO -> CLOUDINARY DIRECTO
  // ===========================

  const uploadHero = async (file) => {
    setLoadingHero(true);

    const data = new FormData();
    data.append("file", file);
    data.append(
      "upload_preset",
      process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET
    );

    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;

    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      {
        method: "POST",
        body: data,
      }
    );

    const result = await res.json();

    localStorage.setItem("heroImage", result.secure_url);

    setPreviewHero(result.secure_url);
    setLoadingHero(false);

    alert("Hero actualizado ✅");
  };

  // ===========================
  // BANNER -> BACKEND
  // ===========================

  const uploadBanner = async (file) => {
    setLoadingBanner(true);

    const data = new FormData();
    data.append("image", file);

    const apiUrl =
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

    await fetch(`${apiUrl}/banners`, {
      method: "POST",
      body: data,
    });

    setPreviewBanner(null);
    setLoadingBanner(false);

    alert("Banner cargado ✅");
  };

  return (
    <div className="space-y-12">

      {/* ================= HERO ================= */}

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white border rounded-2xl p-6 max-w-xl shadow-sm"
      >
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <ImageIcon className="w-5 h-5" />
          Imagen principal (Hero Home)
        </h2>

        {!previewHero ? (
          <label className="flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-8 cursor-pointer hover:bg-gray-50 transition">
            <Upload className="w-10 h-10 text-gray-400" />
            <span className="text-sm text-gray-500 mt-2">
              Subir nueva imagen del hero
            </span>

            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                uploadHero(file);
              }}
            />
          </label>
        ) : (
          <div className="relative">
            <img
              src={previewHero}
              className="w-full h-56 object-cover rounded-xl border"
            />
            <button
              onClick={() => setPreviewHero(null)}
              className="absolute top-2 right-2 bg-black/70 text-white rounded-full w-8 h-8"
            >
              ✕
            </button>
          </div>
        )}

        {loadingHero && (
          <p className="text-sm text-gray-500 mt-2">Subiendo hero...</p>
        )}
      </motion.div>

      {/* ================= BANNERS ================= */}

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white border rounded-2xl p-6 max-w-xl shadow-sm"
      >
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <ImageIcon className="w-5 h-5" />
          Imagenes del carrusel
        </h2>

        {!previewBanner ? (
          <label className="flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-8 cursor-pointer hover:bg-gray-50 transition">
            <Upload className="w-10 h-10 text-gray-400" />
            <span className="text-sm text-gray-500 mt-2">
              Subir nuevo banner
            </span>

            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;

                setPreviewBanner(URL.createObjectURL(file));
                uploadBanner(file);
              }}
            />
          </label>
        ) : (
          <div className="relative">
            <img
              src={previewBanner}
              className="w-full h-48 object-cover rounded-xl border"
            />
          </div>
        )}

        {loadingBanner && (
          <p className="text-sm text-gray-500 mt-2">Subiendo banner...</p>
        )}
      </motion.div>
    </div>
  );
}

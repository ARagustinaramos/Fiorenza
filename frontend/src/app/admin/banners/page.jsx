"use client";

import { useEffect, useState } from "react";
import { Image as ImageIcon, Upload } from "lucide-react";
import { motion } from "framer-motion";

export default function AdminBannersPage() {
  const [loadingBanner, setLoadingBanner] = useState(false);
  const [loadingHero, setLoadingHero] = useState(false);

  const [previewBanner, setPreviewBanner] = useState(null);
  const [previewHero, setPreviewHero] = useState(null);
  const [carouselBanners, setCarouselBanners] = useState([]);

  const apiUrl =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

  useEffect(() => {
    const fetchHero = async () => {
      try {
        const res = await fetch(`${apiUrl}/banners`, { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        const hero = data.find((b) => b.title === "hero");
        if (hero?.imageUrl) {
          setPreviewHero(hero.imageUrl);
        }
      } catch (error) {
        console.error("Error cargando hero:", error);
      }
    };

    fetchHero();
  }, [apiUrl]);

  useEffect(() => {
    const fetchCarouselBanners = async () => {
      try {
        const res = await fetch(`${apiUrl}/banners`, { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        const list = Array.isArray(data) ? data : [];
        setCarouselBanners(list.filter((b) => b.title !== "hero"));
      } catch (error) {
        console.error("Error cargando banners:", error);
      }
    };

    fetchCarouselBanners();
  }, [apiUrl]);

  const uploadHero = async (file) => {
    setLoadingHero(true);

    try {
      const data = new FormData();
      data.append("image", file);
      data.append("title", "hero"); 

      const res = await fetch(`${apiUrl}/banners`, {
        method: "POST",
        body: data,
      });

      if (!res.ok) throw new Error("Error en API");

      const result = await res.json();

      setPreviewHero(result.imageUrl);
      alert("Hero actualizado ✅");
    } catch (error) {
      alert("Error al subir la imagen");
      console.error(error);
    } finally {
      setLoadingHero(false);
    }
  };

  const uploadBanner = async (file) => {
    setLoadingBanner(true);

    try {
      const data = new FormData();
      data.append("image", file);

      const res = await fetch(`${apiUrl}/banners`, {
        method: "POST",
        body: data,
      });

      if (!res.ok) throw new Error("Error en API");

      setPreviewBanner(null);
      alert("Banner cargado ✅");
    } catch (error) {
      alert("Error al guardar el banner");
    } finally {
      try {
        const res = await fetch(`${apiUrl}/banners`, { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          const list = Array.isArray(data) ? data : [];
          setCarouselBanners(list.filter((b) => b.title !== "hero"));
        }
      } catch {
        // ignore
      }
      setLoadingBanner(false);
    }
  };

  const deleteCarouselBanner = async (id) => {
    try {
      const res = await fetch(`${apiUrl}/banners/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Error al borrar banner");
      setCarouselBanners((prev) => prev.filter((b) => b.id !== id));
    } catch (error) {
      alert("No se pudo borrar el banner");
      console.error(error);
    }
  };

  return (
    <div className="space-y-12 max-w-3xl mx-auto px-4">
      {/* HERO */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white border rounded-2xl p-6 max-w-xl mx-auto"
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
              className="w-full h-56 object-contain rounded-xl border bg-white shadow-none"
            />
            <button
              onClick={() => setPreviewHero(null)}
              className="absolute top-2 right-2 bg-white/90 text-gray-700 border border-gray-200 shadow-sm rounded-full w-8 h-8 hover:bg-white"
            >
              ✕
            </button>
          </div>
        )}

        {loadingHero && (
          <p className="text-sm text-gray-500 mt-2">Subiendo hero...</p>
        )}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white border rounded-2xl p-6 max-w-xl mx-auto"
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
              className="w-full h-48 object-contain rounded-xl border bg-white shadow-none"
            />
          </div>
        )}

        {loadingBanner && (
          <p className="text-sm text-gray-500 mt-2">Subiendo banner...</p>
        )}

        {carouselBanners.length > 0 && (
          <div className="mt-6">
            <p className="text-sm font-semibold text-gray-700 mb-3">
              Banners actuales
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {carouselBanners.map((banner) => (
                <div
                  key={banner.id}
                  className="relative border rounded-lg overflow-hidden bg-white"
                >
                  <img
                    src={banner.imageUrl}
                    alt={banner.title || "Banner"}
                    className="w-full h-24 object-cover"
                  />
                  <button
                    onClick={() => deleteCarouselBanner(banner.id)}
                    className="absolute top-1 right-1 bg-white/90 text-gray-700 border border-gray-200 rounded-full w-6 h-6 text-xs hover:bg-white"
                    title="Eliminar banner"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}

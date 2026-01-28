"use client";

import { useEffect, useState } from "react";
import { Plus, Image as ImageIcon } from "lucide-react";

export default function AdminBannersPage() {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(null); // ✅ FALTABA

  const [form, setForm] = useState({
    title: "",
    subtitle: "",
    order: 0,
    link: "",
    image: null,
  });

  // 🔹 Traer banners
  const fetchBanners = async () => {
    const apiUrl =
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

    const res = await fetch(`${apiUrl}/banners`);
    const data = await res.json();
    setBanners(data);
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  // 🔹 Submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.image) return alert("Seleccioná una imagen");

    setLoading(true);

    const data = new FormData();
    data.append("image", form.image);
    data.append("title", form.title);
    data.append("subtitle", form.subtitle);
    data.append("order", form.order);
    data.append("link", form.link);

    const apiUrl =
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

    await fetch(`${apiUrl}/banners`, {
      method: "POST",
      body: data,
    });

    // 🔄 Reset
    setForm({
      title: "",
      subtitle: "",
      order: 0,
      link: "",
      image: null,
    });
    setPreview(null); // ✅ limpiar preview

    await fetchBanners();
    setLoading(false);
  };

  return (
    <div className="space-y-8">
      {/* HEADER */}
      <div>
        <h1 className="text-3xl font-bold">Banners / Carrusel</h1>
        <p className="text-sm text-gray-500">
          Administrá las imágenes del carrusel
        </p>
      </div>

      {/* FORM */}
      <form
        onSubmit={handleSubmit}
        className="bg-white border rounded-xl p-6 space-y-4 max-w-xl"
      >
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Plus className="w-5 h-5" /> Nuevo banner
        </h2>

        {/* IMAGEN */}
        <div className="space-y-2">
          {!preview ? (
            <label className="flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-6 cursor-pointer hover:bg-gray-50">
              <ImageIcon className="w-8 h-8 text-gray-400" />
              <span className="text-sm text-gray-500 mt-2">
                Seleccionar imagen
              </span>

              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;

                  setForm({ ...form, image: file });
                  setPreview(URL.createObjectURL(file));
                }}
              />
            </label>
          ) : (
            <div className="relative w-full">
              <img
                src={preview}
                className="w-full h-48 object-cover rounded-xl border"
              />
              <button
                type="button"
                onClick={() => {
                  setPreview(null);
                  setForm({ ...form, image: null });
                }}
                className="absolute top-2 right-2 bg-black/70 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-black"
              >
                ✕
              </button>
            </div>
          )}
        </div>

        <button
          disabled={loading}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-semibold"
        >
          {loading ? "Subiendo..." : "Subir banner"}
        </button>
      </form>

      {/* LISTADO */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {banners.map((banner) => (
          <div
            key={banner.id}
            className="bg-white border rounded-xl overflow-hidden shadow-sm"
          >
            <img
              src={banner.imageUrl}
              alt={banner.title}
              className="w-full h-40 object-cover"
            />

            <div className="p-4 space-y-1">
              <p className="font-semibold">{banner.title || "—"}</p>
              <p className="text-sm text-gray-500">
                {banner.subtitle || "—"}
              </p>
              <p className="text-xs text-blue-600 truncate">
                Link: {banner.link || "-"}
              </p>
              <p className="text-xs text-gray-400">
                Orden: {banner.order}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

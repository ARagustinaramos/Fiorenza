"use client";

import { useEffect, useState } from "react";
import { Upload } from "lucide-react";

export default function Perfil() {
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
    nombreCompleto: "",
    email: "",
    telefono: "",
    cuitCuil: "",
    empresa: "",
    cargo: "",
    coeficienteVenta: 0,
    avatarUrl: "",
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const apiUrl =
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";
        const token = localStorage.getItem("token");
        
        if (!token) {
          setLoading(false);
          return;
        }

        const res = await fetch(`${apiUrl}/users/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          throw new Error("Error al cargar el perfil");
        }

        const data = await res.json();

        console.log("[DEBUG] Datos del perfil cargados:", data);

        setForm({
          nombreCompleto: data.perfil?.nombreCompleto || "",
          email: data.email || "",
          telefono: data.perfil?.telefono || "",
          cuitCuil: data.perfil?.cuitCuil || "",
          empresa: data.perfil?.empresa || "",
          cargo: data.perfil?.cargo || "",
          coeficienteVenta: data.perfil?.coeficienteVenta || 0,
          avatarUrl: data.perfil?.avatarUrl || "",
        });

        setLoading(false);
      } catch (error) {
        console.error("Error cargando perfil", error);
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tamaño
    if (file.size > 5 * 1024 * 1024) {
      alert("La imagen no puede superar los 5MB");
      return;
    }
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

    if (!cloudName || !uploadPreset) {
      console.error("❌ Faltan variables de Cloudinary:", {
        cloudName: !!cloudName,
        uploadPreset: !!uploadPreset,
      });
      alert("Error: Cloudinary no configurado correctamente");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", uploadPreset);

    try {
      console.log(`📤 Subiendo imagen a Cloudinary (${cloudName})...`);

      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await res.json();

      if (!res.ok) {
        console.error("❌ Error de Cloudinary:", data);
        throw new Error(
          data.error?.message || `Error ${res.status}: ${res.statusText}`
        );
      }

      if (!data.secure_url) {
        console.error("❌ Cloudinary respondió sin URL:", data);
        throw new Error("La respuesta de Cloudinary no contiene URL de imagen");
      }

      console.log("✓ Imagen subida correctamente:", data.secure_url);
      
      setForm((prev) => ({ ...prev, avatarUrl: data.secure_url }));
    } catch (err) {
      console.error("❌ Error subiendo imagen:", err);
      alert(`Error al subir imagen: ${err.message}`);
    }
  };


  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const apiUrl =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";
      const token = localStorage.getItem("token");

      if (!token) {
        alert("Debes iniciar sesión para actualizar tu perfil");
        return;
      }
      if (!form.nombreCompleto || !form.cuitCuil || !form.empresa) {
        alert("Por favor completa los campos obligatorios: Nombre completo, CUIT/CUIL y Empresa");
        return;
      }

      const res = await fetch(`${apiUrl}/users/me`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          nombreCompleto: form.nombreCompleto,
          telefono: form.telefono || null,
          cuitCuil: form.cuitCuil,
          empresa: form.empresa,
          cargo: form.cargo || null,
          coeficienteVenta: form.coeficienteVenta || 0,
          avatarUrl: form.avatarUrl,
        }),
      });

      console.log("[DEBUG] Enviando al servidor:", {
        nombreCompleto: form.nombreCompleto,
        telefono: form.telefono || null,
        cuitCuil: form.cuitCuil,
        empresa: form.empresa,
        cargo: form.cargo || null,
        coeficienteVenta: form.coeficienteVenta || 0,
        avatarUrl: form.avatarUrl,
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: "Error desconocido" }));
      
        const errorMessages = {
          NOMBRE_COMPLETO_REQUIRED: "El nombre completo es obligatorio",
          CUIT_CUIL_REQUIRED: "El CUIT/CUIL es obligatorio",
          EMPRESA_REQUIRED: "La empresa es obligatoria",
          INVALID_COEFICIENTE_VENTA: "El coeficiente de venta debe ser un número entre 0 y 500",
          ERROR_UPDATE_PROFILE: "Error al actualizar el perfil",
        };
        
        const errorMessage = errorMessages[errorData.error] || errorData.error || "Error al actualizar el perfil";
        throw new Error(errorMessage);
      }

      const updatedData = await res.json();
      
      console.log("[DEBUG] Datos después de actualizar:", updatedData);

      setForm({
        ...form,
        nombreCompleto: updatedData.perfil?.nombreCompleto || form.nombreCompleto,
        telefono: updatedData.perfil?.telefono || form.telefono,
        cuitCuil: updatedData.perfil?.cuitCuil || form.cuitCuil,
        empresa: updatedData.perfil?.empresa || form.empresa,
        cargo: updatedData.perfil?.cargo || form.cargo,
        coeficienteVenta: updatedData.perfil?.coeficienteVenta || form.coeficienteVenta,
        avatarUrl: updatedData.perfil?.avatarUrl || form.avatarUrl,
      });
      
      alert("Perfil actualizado correctamente");
    } catch (error) {
      console.error("Error actualizando perfil", error);
      alert(`Error al actualizar el perfil: ${error.message}`);
    }
  };

  if (loading) {
    return <p className="text-center mt-10">Cargando perfil...</p>;
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-4xl font-bold mb-8">Mi Perfil</h1>

      <div className="bg-white rounded-lg p-8 shadow-sm">
        <div className="mb-8 flex items-center gap-6">
          <div className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
            {form.avatarUrl ? (
              <img
                src={form.avatarUrl}
                alt="Perfil"
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-4xl text-gray-400">👤</span>
            )}
          </div>

          <div>
            <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
              <Upload className="w-4 h-4" />
              <span>Subir foto</span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageUpload}
              />
            </label>

            <p className="text-sm text-gray-500 mt-2">
              JPG, PNG o GIF. Máximo 5MB
            </p>
          </div>
        </div>

        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="Nombre completo"
              value={form.nombreCompleto}
              onChange={(e) =>
                setForm({ ...form, nombreCompleto: e.target.value })
              }
            />

            <Input label="Email" type="email" value={form.email} disabled />

            <Input
              label="Teléfono"
              value={form.telefono}
              onChange={(e) => setForm({ ...form, telefono: e.target.value })}
            />

            <Input
              label="CUIT/CUIL"
              value={form.cuitCuil}
              onChange={(e) => setForm({ ...form, cuitCuil: e.target.value })}
            />

            <Input
              label="Empresa"
              value={form.empresa}
              onChange={(e) => setForm({ ...form, empresa: e.target.value })}
            />

            <Input
              label="Cargo"
              value={form.cargo}
              onChange={(e) => setForm({ ...form, cargo: e.target.value })}
            />
            <Input
              label="Coeficiente de venta (%)"
              type="number"
              value={form.coeficienteVenta}
              onChange={(e) =>
                setForm({ ...form, coeficienteVenta: Number(e.target.value) })
              }
            />
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Guardar cambios
            </button>

            <button
              type="button"
              className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Input({ label, type = "text", value, onChange, disabled = false }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={onChange}
        disabled={disabled}
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 disabled:bg-gray-100"
      />
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { Upload } from "lucide-react";
import { buildApiUrl } from "../../../lib/api";
import { getShippingProfileMissingFields } from "../../../lib/shipping";

const initialForm = {
  nombreCompleto: "",
  email: "",
  telefono: "",
  cuitCuil: "",
  empresa: "",
  cargo: "",
  coeficienteVenta: 0,
  avatarUrl: "",
  direccion: "",
  ciudad: "",
  provincia: "",
  codigoPostal: "",
  referencia: "",
  dni: "",
};

export default function Perfil() {
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState("");
  const [form, setForm] = useState(initialForm);

  const isMinorista = role === "MINORISTA";

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem("token");

        if (!token) {
          setLoading(false);
          return;
        }

        const res = await fetch(buildApiUrl("/users/me"), {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          throw new Error("Error al cargar el perfil");
        }

        const data = await res.json();
        const nextRole = data.rol || "";
        const minoristaProfile = data.perfilMinorista || {};
        const mayoristaProfile = data.perfil || {};

        setRole(nextRole);
        setForm({
          nombreCompleto:
            mayoristaProfile.nombreCompleto ||
            minoristaProfile.nombreCompleto ||
            "",
          email: data.email || "",
          telefono: mayoristaProfile.telefono || minoristaProfile.telefono || "",
          cuitCuil: nextRole === "MINORISTA" ? "" : mayoristaProfile.cuitCuil || "",
          empresa: nextRole === "MINORISTA" ? "" : mayoristaProfile.empresa || "",
          cargo: nextRole === "MINORISTA" ? "" : mayoristaProfile.cargo || "",
          coeficienteVenta:
            nextRole === "MINORISTA" ? 0 : mayoristaProfile.coeficienteVenta || 0,
          avatarUrl: nextRole === "MINORISTA" ? "" : mayoristaProfile.avatarUrl || "",
          direccion: minoristaProfile.direccion || "",
          ciudad: minoristaProfile.ciudad || "",
          provincia: minoristaProfile.provincia || "",
          codigoPostal: minoristaProfile.codigoPostal || "",
          referencia: minoristaProfile.referencia || "",
          dni: minoristaProfile.dni || "",
        });
      } catch (error) {
        console.error("Error cargando perfil", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleImageUpload = async (e) => {
    if (isMinorista) return;

    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("La imagen no puede superar los 5MB");
      return;
    }

    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

    if (!cloudName || !uploadPreset) {
      alert("Error: Cloudinary no configurado correctamente");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", uploadPreset);

    try {
      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await res.json();

      if (!res.ok || !data.secure_url) {
        throw new Error(
          data.error?.message || `Error ${res.status}: ${res.statusText}`
        );
      }

      setForm((prev) => ({ ...prev, avatarUrl: data.secure_url }));
    } catch (error) {
      console.error("Error subiendo imagen:", error);
      alert(`Error al subir imagen: ${error.message}`);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const token = localStorage.getItem("token");

      if (!token) {
        alert("Debes iniciar sesion para actualizar tu perfil");
        return;
      }

      if (!form.nombreCompleto.trim()) {
        alert("Por favor completa tu nombre completo");
        return;
      }

      if (!isMinorista && (!form.cuitCuil || !form.empresa)) {
        alert(
          "Por favor completa los campos obligatorios: Nombre completo, CUIT/CUIL y Empresa"
        );
        return;
      }

      if (isMinorista) {
        const missingFields = getShippingProfileMissingFields(form);
        if (missingFields.length > 0) {
          alert(
            "Para guardar tu perfil minorista necesitás completar nombre completo, telefono, direccion, ciudad, provincia y codigo postal."
          );
          return;
        }
      }

      const payload = isMinorista
        ? {
            nombreCompleto: form.nombreCompleto.trim(),
            telefono: form.telefono || null,
            direccion: form.direccion || null,
            ciudad: form.ciudad || null,
            provincia: form.provincia || null,
            codigoPostal: form.codigoPostal || null,
            referencia: form.referencia || null,
            dni: form.dni || null,
          }
        : {
            nombreCompleto: form.nombreCompleto.trim(),
            telefono: form.telefono || null,
            cuitCuil: form.cuitCuil,
            empresa: form.empresa,
            cargo: form.cargo || null,
            coeficienteVenta: form.coeficienteVenta || 0,
            avatarUrl: form.avatarUrl,
          };

      const res = await fetch(buildApiUrl("/users/me"), {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res
          .json()
          .catch(() => ({ error: "Error desconocido" }));

        const errorMessages = {
          NOMBRE_COMPLETO_REQUIRED: "El nombre completo es obligatorio",
          CUIT_CUIL_REQUIRED: "El CUIT/CUIL es obligatorio",
          EMPRESA_REQUIRED: "La empresa es obligatoria",
          INVALID_COEFICIENTE_VENTA:
            "El coeficiente de venta debe ser un numero entre 0 y 500",
          MINORISTA_SHIPPING_PROFILE_INCOMPLETE:
            "Completa telefono, direccion, ciudad, provincia y codigo postal para usar envios.",
          ERROR_UPDATE_PROFILE: "Error al actualizar el perfil",
        };

        const errorMessage =
          errorMessages[errorData.error] ||
          errorData.error ||
          "Error al actualizar el perfil";
        throw new Error(errorMessage);
      }

      const updatedData = await res.json();
      const updatedMayorista = updatedData.perfil || {};
      const updatedMinorista = updatedData.perfilMinorista || {};

      setForm((prev) => ({
        ...prev,
        nombreCompleto:
          updatedMayorista.nombreCompleto ||
          updatedMinorista.nombreCompleto ||
          prev.nombreCompleto,
        telefono:
          updatedMayorista.telefono ||
          updatedMinorista.telefono ||
          prev.telefono,
        cuitCuil: updatedMayorista.cuitCuil || prev.cuitCuil,
        empresa: updatedMayorista.empresa || prev.empresa,
        cargo: updatedMayorista.cargo || prev.cargo,
        coeficienteVenta:
          updatedMayorista.coeficienteVenta ?? prev.coeficienteVenta,
        avatarUrl: updatedMayorista.avatarUrl || prev.avatarUrl,
        direccion: updatedMinorista.direccion || prev.direccion,
        ciudad: updatedMinorista.ciudad || prev.ciudad,
        provincia: updatedMinorista.provincia || prev.provincia,
        codigoPostal: updatedMinorista.codigoPostal || prev.codigoPostal,
        referencia: updatedMinorista.referencia || prev.referencia,
        dni: updatedMinorista.dni || prev.dni,
      }));

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
        {isMinorista && (
          <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            Estos datos se usan para el checkout minorista y quedan guardados en cada pedido como historial de envio.
          </div>
        )}

        {!isMinorista && (
          <div className="mb-8 flex items-center gap-6">
            <div className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
              {form.avatarUrl ? (
                <img
                  src={form.avatarUrl}
                  alt="Perfil"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-4xl text-gray-400">?</span>
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
                JPG, PNG o GIF. Maximo 5MB
              </p>
            </div>
          </div>
        )}

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
              label="Telefono"
              value={form.telefono}
              onChange={(e) => setForm({ ...form, telefono: e.target.value })}
            />

            {isMinorista ? (
              <Input
                label="DNI"
                value={form.dni}
                onChange={(e) => setForm({ ...form, dni: e.target.value })}
              />
            ) : (
              <Input
                label="CUIT/CUIL"
                value={form.cuitCuil}
                onChange={(e) => setForm({ ...form, cuitCuil: e.target.value })}
              />
            )}

            {isMinorista ? (
              <Input
                label="Direccion"
                value={form.direccion}
                onChange={(e) => setForm({ ...form, direccion: e.target.value })}
              />
            ) : (
              <Input
                label="Empresa"
                value={form.empresa}
                onChange={(e) => setForm({ ...form, empresa: e.target.value })}
              />
            )}

            {!isMinorista && (
              <>
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
                    setForm({
                      ...form,
                      coeficienteVenta: Number(e.target.value),
                    })
                  }
                />
              </>
            )}

            {isMinorista && (
              <>
                <Input
                  label="Ciudad"
                  value={form.ciudad}
                  onChange={(e) => setForm({ ...form, ciudad: e.target.value })}
                />
                <Input
                  label="Provincia"
                  value={form.provincia}
                  onChange={(e) => setForm({ ...form, provincia: e.target.value })}
                />
                <Input
                  label="Codigo Postal"
                  value={form.codigoPostal}
                  onChange={(e) =>
                    setForm({ ...form, codigoPostal: e.target.value })
                  }
                />
                <Input
                  label="Referencia adicional"
                  value={form.referencia}
                  onChange={(e) =>
                    setForm({ ...form, referencia: e.target.value })
                  }
                />
              </>
            )}
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
              onClick={() => window.location.reload()}
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

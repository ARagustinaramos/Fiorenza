"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { buildApiUrl } from "../../lib/api";

export default function RegistroPage() {
  const router = useRouter();
  const enableMinorista =
    String(process.env.NEXT_PUBLIC_ENABLE_MINORISTA || "false").toLowerCase() ===
    "true";

  const [form, setForm] = useState({
    nombreCompleto: "",
    email: "",
    password: "",
    telefono: "",
    direccion: "",
    dni: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!enableMinorista) {
      router.replace("/login");
    }
  }, [enableMinorista, router]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setLoading(true);

    try {
      const res = await fetch(buildApiUrl("/auth/register-minorista"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "REGISTER_ERROR");
      }

      setSuccess(true);
    } catch (err) {
      if (err.message === "USER_EXISTS") {
        setError("Ya existe una cuenta con ese email.");
      } else if (err.message === "PASSWORD_TOO_SHORT") {
        setError("La contraseña debe tener al menos 6 caracteres.");
      } else if (err.message === "EMAIL_AND_PASSWORD_REQUIRED") {
        setError("Email y contraseña son obligatorios.");
      } else {
        setError("No se pudo crear la cuenta. Intentá de nuevo.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md">
        <h2 className="text-2xl font-bold text-center">Crear cuenta minorista</h2>
        <p className="text-center text-sm text-gray-500 mt-1">
          Registrate con tu email o usá Google desde el login.
        </p>

        {error && (
          <p className="text-sm text-red-600 text-center mt-4">{error}</p>
        )}
        {success && (
          <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800 text-center">
            Cuenta creada. Ahora podés iniciar sesión.
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 mt-6">
          <input
            type="text"
            name="nombreCompleto"
            placeholder="Nombre completo"
            className="w-full px-4 py-3 border rounded-lg"
            value={form.nombreCompleto}
            onChange={handleChange}
          />
          <input
            type="email"
            name="email"
            placeholder="Email"
            className="w-full px-4 py-3 border rounded-lg"
            value={form.email}
            onChange={handleChange}
            required
          />
          <input
            type="password"
            name="password"
            placeholder="Contraseña"
            className="w-full px-4 py-3 border rounded-lg"
            value={form.password}
            onChange={handleChange}
            required
          />
          <input
            type="text"
            name="telefono"
            placeholder="Teléfono (opcional)"
            className="w-full px-4 py-3 border rounded-lg"
            value={form.telefono}
            onChange={handleChange}
          />
          <input
            type="text"
            name="direccion"
            placeholder="Dirección (opcional)"
            className="w-full px-4 py-3 border rounded-lg"
            value={form.direccion}
            onChange={handleChange}
          />
          <input
            type="text"
            name="dni"
            placeholder="DNI (opcional)"
            className="w-full px-4 py-3 border rounded-lg"
            value={form.dni}
            onChange={handleChange}
          />

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full py-3 disabled:opacity-50"
          >
            {loading ? "Creando..." : "Crear cuenta"}
          </button>
        </form>

        <div className="text-center text-sm mt-4">
          ¿Ya tenés cuenta?{" "}
          <button
            type="button"
            onClick={() => router.push("/login")}
            className="text-red-600 hover:underline"
          >
            Iniciar sesión
          </button>
        </div>
      </div>
    </div>
  );
}

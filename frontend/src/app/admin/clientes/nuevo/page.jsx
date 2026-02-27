"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const CREATE_USER_ERROR_MESSAGES = {
  USER_EXISTS: "Ya existe un usuario con ese email.",
  EMAIL_AND_PASSWORD_REQUIRED: "Email y contrasena son obligatorios.",
  NOMBRE_COMPLETO_REQUIRED: "El nombre completo es obligatorio.",
  PASSWORD_TOO_SHORT: "La contrasena debe tener al menos 6 caracteres.",
  UNAUTHORIZED: "Tu sesion expiro. Volve a iniciar sesion.",
  FORBIDDEN: "No tenes permisos para crear usuarios.",
  ERROR_CREATE_USER: "No se pudo crear el cliente.",
};

const getCreateUserErrorMessage = (errorCode, status) => {
  if (CREATE_USER_ERROR_MESSAGES[errorCode]) {
    return CREATE_USER_ERROR_MESSAGES[errorCode];
  }

  if (status === 500) {
    return "Error interno del servidor. Intenta nuevamente en unos minutos.";
  }

  if (status === 400) {
    return "Revisa los datos ingresados e intenta nuevamente.";
  }

  return "No se pudo crear el cliente.";
};

export default function NuevoClientePage() {
  const router = useRouter();

  const [nombreCompleto, setNombreCompleto] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rol, setRol] = useState("MAYORISTA");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");

    try {
      const apiUrl =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";
      const token = localStorage.getItem("token");

      const res = await fetch(`${apiUrl}/users`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nombreCompleto: nombreCompleto.trim(),
          email: email.trim().toLowerCase(),
          password,
          rol,
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        const errorCode = data?.error || `HTTP_${res.status}`;
        const apiError = new Error(errorCode);
        apiError.status = res.status;
        throw apiError;
      }

      setMessage("✅ Cliente creado correctamente");

      // pequeño delay para que se vea el mensaje
      setTimeout(() => {
        router.push("/admin/clientes?refresh=true");
      }, 1200);
    } catch (err) {
      console.error(err);
      setError(getCreateUserErrorMessage(err.message, err.status));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <main className="flex-1 p-8 max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Nuevo Cliente</h1>

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-6"
        >
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre completo
            </label>
            <input
              type="text"
              required
              value={nombreCompleto}
              onChange={(e) => setNombreCompleto(e.target.value)}
              className="w-full border rounded px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border rounded px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Contraseña
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border rounded px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tipo de cliente
            </label>
            <select
              value={rol}
              onChange={(e) => setRol(e.target.value)}
              className="w-full border rounded px-3 py-2"
            >
              <option value="MAYORISTA">Mayorista</option>
              <option value="MINORISTA">Minorista</option>
              <option value="ADMIN">Administrador</option>
            </select>
          </div>

          {message && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-2 rounded">
              {message}
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-2 bg-gray-200 rounded hover:bg-gray-300 font-medium"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-red-600 text-white rounded hover:bg-red-700 font-medium disabled:opacity-50"
            >
              {loading ? "Creando..." : "Crear cliente"}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}

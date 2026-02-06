"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../context/AuthContext";

export function LoginForm({ onSuccess }) {
  const { login } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberEmail, setRememberEmail] = useState(true);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const savedEmail = localStorage.getItem("rememberedEmail");
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberEmail(true);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const user = await login(email, password);
      if (rememberEmail) {
        localStorage.setItem("rememberedEmail", email);
      } else {
        localStorage.removeItem("rememberedEmail");
      }
      onSuccess?.();

     
      if (user.rol === "mayorista" || user.rol === "MAYORISTA") {
        router.push("/mayorista");
      } else if (user.rol === "minorista" || user.rol === "MINORISTA") {
        router.push("/");
      } else if (user.rol === "admin" || user.rol === "ADMIN") {
        router.push("/admin/dashboard");
      } else {
        router.push("/");
      }
    } catch (err) {
      setError("Email o contraseña incorrectos");
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <h2 className="text-2xl font-bold text-center">
        Iniciar sesión
      </h2>

      {error && (
        <p className="text-sm text-red-600 text-center">
          {error}
        </p>
      )}

      <input
        type="email"
        placeholder="Email"
        className="w-full px-4 py-3 border rounded-lg"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />

      <input
        type="password"
        placeholder="Contraseña"
        className="w-full px-4 py-3 border rounded-lg"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      
      <label className="flex items-center gap-2 text-sm text-gray-600">
        <input
          type="checkbox"
          checked={rememberEmail}
          onChange={(e) => setRememberEmail(e.target.checked)}
          className="accent-red-600"
        />
        Recordar mi email
      </label>
      <div className="text-right">
        <button
          type="button"
          onClick={() => router.push("/forgot-password")}
          className="text-sm text-red-600 hover:underline"
        >
          ¿Olvidaste tu contraseña?
        </button>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="btn-primary w-full py-3 disabled:opacity-50"
      >
        {loading ? "Ingresando..." : "Entrar"}
      </button>
    </form>
  );
}



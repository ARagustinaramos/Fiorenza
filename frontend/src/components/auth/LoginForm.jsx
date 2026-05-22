"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../context/AuthContext";

export function LoginForm({ onSuccess }) {
  const { login, loginWithGoogle } = useAuth();
  const router = useRouter();
  const googleInitRef = useRef(false);
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  const enableMinorista =
    String(process.env.NEXT_PUBLIC_ENABLE_MINORISTA || "false").toLowerCase() ===
    "true";
  const [accountType, setAccountType] = useState("MAYORISTA");

  useEffect(() => {
    if (!enableMinorista && accountType === "MINORISTA") {
      setAccountType("MAYORISTA");
    }
  }, [accountType, enableMinorista]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberEmail, setRememberEmail] = useState(true);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const googleButtonRenderedRef = useRef(false);

  const getGoogleErrorMessage = (errorCode) => {
    switch (errorCode) {
      case "MINORISTA_DISABLED":
        return "El acceso minorista con Google no esta habilitado en este entorno.";
      case "ID_TOKEN_REQUIRED":
      case "INVALID_GOOGLE_TOKEN":
        return "Google no pudo validar la sesion. Proba nuevamente.";
      case "GOOGLE_AUD_MISMATCH":
        return "La configuracion de Google no coincide entre frontend y backend.";
      case "ACCOUNT_EXISTS_DIFFERENT_PROVIDER":
        return "Ese email ya existe con otro metodo de acceso. Inicia sesion con email y contrasena.";
      default:
        return "No se pudo iniciar sesion con Google.";
    }
  };

  useEffect(() => {
    const savedEmail = localStorage.getItem("rememberedEmail");
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberEmail(true);
    }
  }, []);

  useEffect(() => {
    if (
      !enableMinorista ||
      !googleClientId ||
      googleInitRef.current ||
      accountType !== "MINORISTA"
    )
      return;

    const initializeGoogle = () => {
      if (!window.google?.accounts?.id) return;
      if (!window.__fiorenzaGoogleInitialized) {
        window.google.accounts.id.initialize({
          client_id: googleClientId,
          callback: async (response) => {
            setError(null);
            setLoading(true);
            try {
              const user = await loginWithGoogle(response.credential);
              onSuccess?.();
              if (user.rol === "mayorista" || user.rol === "MAYORISTA") {
                router.push("/mayorista");
              } else if (user.rol === "minorista" || user.rol === "MINORISTA") {
                router.push("/minorista");
              } else if (user.rol === "admin" || user.rol === "ADMIN") {
                router.push("/admin/dashboard");
              } else {
                router.push("/");
              }
            } catch (err) {
              setError(getGoogleErrorMessage(err?.message));
              console.error("Google login error:", err);
            } finally {
              setLoading(false);
            }
          },
        });
        window.__fiorenzaGoogleInitialized = true;
      }
      googleInitRef.current = true;

      const target = document.getElementById("google-signin-btn");
      if (target && !googleButtonRenderedRef.current) {
        target.innerHTML = "";
        window.google.accounts.id.renderButton(target, {
          theme: "outline",
          size: "large",
          width: "300",
        });
        googleButtonRenderedRef.current = true;
      }
    };

    if (window.google?.accounts?.id) {
      initializeGoogle();
      return;
    }

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = initializeGoogle;
    document.head.appendChild(script);

    return () => {
      script.onload = null;
    };
  }, [accountType, googleClientId, loginWithGoogle, onSuccess, router]);

  useEffect(() => {
    if (accountType !== "MINORISTA") {
      googleButtonRenderedRef.current = false;
      const target = document.getElementById("google-signin-btn");
      if (target) {
        target.innerHTML = "";
      }
    }
  }, [accountType]);

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
        router.push("/minorista");
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

      <div className="grid grid-cols-2 rounded-lg border border-gray-200 bg-gray-50 p-1 text-sm">
        <button
          type="button"
          onClick={() => setAccountType("MAYORISTA")}
          className={`rounded-md px-3 py-2 font-medium transition ${
            accountType === "MAYORISTA"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-500"
          }`}
        >
          Mayorista
        </button>
        <button
          type="button"
          onClick={() => enableMinorista && setAccountType("MINORISTA")}
          className={`rounded-md px-3 py-2 font-medium transition ${
            accountType === "MINORISTA"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-400"
          } ${enableMinorista ? "" : "cursor-not-allowed"}`}
          disabled={!enableMinorista}
        >
          Minorista
        </button>
      </div>

      {accountType === "MAYORISTA" ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          Las cuentas mayoristas las crea Fiorenza. Si todavía no tenés acceso,
          solicitá tu cuenta desde el formulario de contacto.
          <button
            type="button"
            onClick={() => router.push("/")}
            className="ml-2 text-amber-900 underline"
          >
            Ir a contacto
          </button>
        </div>
      ) : (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          Podés crear tu cuenta minorista gratis en minutos.
        </div>
      )}

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

      {accountType === "MINORISTA" ? (
        <>
          <div className="text-center text-sm text-gray-500">o continuar con</div>
          {googleClientId ? (
            <div id="google-signin-btn" className="w-full flex justify-center" />
          ) : (
            <div className="text-center text-xs text-gray-400">
              Google no está configurado en este entorno.
            </div>
          )}
          <div className="text-center text-sm">
            ¿No tenés cuenta?{" "}
            <button
              type="button"
              onClick={() => router.push("/registro")}
              className="text-red-600 hover:underline"
            >
              Crear cuenta
            </button>
          </div>
        </>
      ) : null}
    </form>
  );
}



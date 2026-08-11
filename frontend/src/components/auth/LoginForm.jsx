"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useDispatch } from "react-redux";
import { useAuth } from "../../context/AuthContext";
import { setCartFromServer } from "../../../store/slices/cartSlice";
import { consumePendingCartProduct, getPendingCartProduct } from "../../lib/pendingCart";

export function LoginForm({ onSuccess }) {
  const { login, loginWithGoogle } = useAuth();
  const router = useRouter();
  const dispatch = useDispatch();
  const googleInitRef = useRef(false);
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  const enableMinorista =
    String(process.env.NEXT_PUBLIC_ENABLE_MINORISTA || "false").toLowerCase() ===
    "true";
  const [accountType, setAccountType] = useState("MAYORISTA");
  const [hideMayoristaOption, setHideMayoristaOption] = useState(false);

 useEffect(() => {
  const savedMode = localStorage.getItem("loginMode");

  if (savedMode === "minorista" && enableMinorista) {
    setAccountType("MINORISTA");
    setHideMayoristaOption(true);
  }

  if (savedMode === "mayorista") {
    setAccountType("MAYORISTA");
    setHideMayoristaOption(false);
  }

  localStorage.removeItem("loginMode");
}, [enableMinorista]);

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
  const googleLoginInProgress = useRef(false);
  
  const WHATSAPP_NUMBER = "5491153444546"
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

  const redirectAfterLogin = useCallback(async (user) => {
    const pendingProduct = getPendingCartProduct();
    const token = localStorage.getItem("token");
console.log("pendingProduct", pendingProduct);
console.log("token", token);
    if (pendingProduct && token) {
      try {
        const cartData = await consumePendingCartProduct({ token });
        
        dispatch(setCartFromServer(cartData?.items || []));
        router.push("/dashboard/carrito");
      } catch (error) {
        console.error("Error agregando producto pendiente al carrito:", error);
        setError("Iniciaste sesion, pero no pudimos agregar el producto al carrito. Proba nuevamente.");
      }
      return;
    }

    if (user.rol === "mayorista" || user.rol === "MAYORISTA") {
      router.push("/mayorista");
    } else if (user.rol === "minorista" || user.rol === "MINORISTA") {
      router.push("/");
    } else if (user.rol === "admin" || user.rol === "ADMIN") {
      router.push("/admin/dashboard");
    } else {
      router.push("/");
    }
  }, [dispatch, router]);

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
      accountType !== "MINORISTA"
    )
      return;

    const initializeGoogle = () => {
      if (!window.google?.accounts?.id) return;
      if (!window.__fiorenzaGoogleInitialized) {
        window.google.accounts.id.initialize({
          client_id: googleClientId,
          callback: async (response) => {
    if (googleLoginInProgress.current) return;

    googleLoginInProgress.current = true;

    setLoading(true);

    try {
        const user = await loginWithGoogle(response.credential);

        onSuccess?.();

        await redirectAfterLogin(user);

    } catch (err) {
              setError(getGoogleErrorMessage(err?.message));
              console.error("Google login error:", err);
             } finally {
        googleLoginInProgress.current = false;
        setLoading(false);
    }
          },
        });
        window.__fiorenzaGoogleInitialized = true;
      }
      googleInitRef.current = true;

      const target = document.getElementById("google-signin-btn");
      if (target) {
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
  }, [accountType, googleClientId, loginWithGoogle, onSuccess, redirectAfterLogin]);

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

      await redirectAfterLogin(user);
    } catch (err) {
      setError("Email o contraseña incorrectos");
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-sm mx-auto px-4">
      <div className="bg-white border border-gray-200 rounded-2xl p-3 shadow-sm space-y-3">

        <h2 className="text-xl font-semibold text-center">
          Iniciar sesión
        </h2>

        {/* SELECTOR */}
        <div className="space-y-2">
          {/* MAYORISTA */}
          {!hideMayoristaOption && (
            <label
              className={`block border rounded-xl p-3 transition-all duration-200 cursor-pointer
          ${accountType === "MAYORISTA"
                  ? "border-red-500 bg-red-50 shadow-sm scale-[1.01]"
                  : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                }`}
            >
              <div className="flex items-center gap-3">
                <input
                  type="radio"
                  name="accountType"
                  value="MAYORISTA"
                  checked={accountType === "MAYORISTA"}
                  onChange={() => setAccountType("MAYORISTA")}
                  className="accent-red-600"
                />
                <p className="text-sm font-medium text-gray-900">Acceso Mayorista</p>
              </div>
            </label>
          )}

          {/* MINORISTA */}
          <label
            className={`block border rounded-xl p-3 transition-all duration-200
          ${enableMinorista ? "cursor-pointer" : "opacity-50 cursor-not-allowed"}
          ${accountType === "MINORISTA"
                ? "border-red-500 bg-red-50 shadow-sm scale-[1.01]"
                : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
              }`}
          >
            <div className="flex items-center gap-3">
              <input
                type="radio"
                name="accountType"
                value="MINORISTA"
                checked={accountType === "MINORISTA"}
                onChange={() =>
                  enableMinorista && setAccountType("MINORISTA")
                }
                disabled={!enableMinorista}
                className="accent-red-600"
              />
              <p className="text-sm font-medium text-gray-900">
                Acceso Minorista
              </p>
            </div>
          </label>

        </div>

        {/* ALERT */}
        {accountType === "MAYORISTA" ? (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs text-amber-800">
            Las cuentas mayoristas las crea Fiorenza.
           <button
  type="button"
  onClick={() =>
    window.open(
      `https://wa.me/${WHATSAPP_NUMBER}?text=Hola!%20Quiero%20solicitar%20acceso%20mayorista`,
      "_blank"
    )
  }
  className="ml-1 underline"
>
  Contacto
</button>
          </div>
        ) : (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs text-emerald-800">
            Podés crear tu cuenta gratis en minutos.
          </div>
        )}

        {/* ERROR */}
        {error && (
          <p className="text-xs text-red-600 text-center">
            {error}
          </p>
        )}

        {/* INPUTS */}
        <input
          type="email"
          placeholder="Email"
          className="w-full px-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 transition"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <input
          type="password"
          placeholder="Contraseña"
          className="w-full px-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 transition"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <div className="flex items-center justify-between text-xs">
          <label className="flex items-center gap-2 text-gray-600">
            <input
              type="checkbox"
              checked={rememberEmail}
              onChange={(e) => setRememberEmail(e.target.checked)}
              className="accent-red-600"
            />
            Recordar
          </label>

          <button
            type="button"
            onClick={() => router.push("/forgot-password")}
            className="text-red-600 hover:underline"
          >
            Olvidé contraseña
          </button>
        </div>

        {/* BOTON */}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 bg-red-600 text-white rounded-lg font-medium
        hover:bg-red-700 transition active:scale-95 disabled:opacity-50"
        >
          {loading ? "Ingresando..." : "Entrar"}
        </button>

        {accountType === "MINORISTA" && (
          <>
            <div className="flex items-center gap-3 text-xs text-gray-400">
              <div className="flex-1 h-px bg-gray-200" />
              <span>o continuar con</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>

            {googleClientId ? (
              <div
                key={accountType}
                id="google-signin-btn"
                className="flex justify-center"
              />
            ) : (
              <div className="text-center text-xs text-gray-400">
                Google no disponible
              </div>
            )}

            <div className="text-center text-xs">
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
        )}

      </div>
    </form>
  );
}



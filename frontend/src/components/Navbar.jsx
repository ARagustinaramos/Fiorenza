"use client";

import Image from "next/image";
import Link from "next/link";
import { ShoppingCart, User, Shield } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import { Modal } from "./ui/Modal";
import { LoginForm } from "./auth/LoginForm";
import { useAuth } from "../context/AuthContext";

export function Navbar() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [openLogin, setOpenLogin] = useState(false);
  const [mounted, setMounted] = useState(false);

  const cartItems = useSelector((state) => state.cart.items || []);
  const cartCount = cartItems.reduce(
    (total, item) => total + item.cantidad,
    0
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  const roleLabel = {
    admin: "Administrador",
    ADMIN: "Administrador",
    mayorista: "Cliente mayorista",
    MAYORISTA: "Cliente mayorista",
    minorista: "Cliente",
    MINORISTA: "Cliente",
  };

  return (
    <>
     <nav className="bg-gradient-to-l from-red-100 via-red-50 to-white px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between shadow-sm">

        {/* LOGO */}
        <Link href="/" className="leading-tight text-center">
          <div className="mx-auto h-10 w-auto sm:h-12">
            <Image
              src="/logo.jpg.png"
              alt="Fiorenza Repuestos"
              width={140}
              height={48}
              className="mx-auto h-10 w-auto sm:h-12 object-contain"
              sizes="(max-width: 640px) 110px, 140px"
            />
          </div>
        </Link>

        {/* DERECHA */}
        <div className="flex items-center gap-2 sm:gap-4">

          {(user?.rol === "mayorista" || user?.rol === "MAYORISTA") && (
            <Link
              href="/mayorista"
              className="text-sm font-medium px-3 py-2 text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-all duration-200"
            >
              Mayorista
            </Link>
          )}

          {(user?.rol === "admin" || user?.rol === "ADMIN") && (
            <Link
              href="/admin/dashboard"
              className="flex items-center gap-1.5 text-sm font-medium px-3 py-2 text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-all duration-200"
            >
              <Shield className="w-4 h-4" />
              Admin
            </Link>
          )}

          {/* CARRITO */}
          {user && user.rol !== "admin" && user.rol !== "ADMIN" && (
            <Link
              href="/dashboard/carrito"
              className="relative p-2 text-gray-700 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
            >
              <ShoppingCart className="w-5 h-5" />

              {mounted && cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </Link>
          )}

          {!user ? (
            <div className="flex items-center gap-4">

              <div className="hidden md:flex flex-col leading-tight text-right">
                <span className="text-xs text-gray-500">
                  Acceso mayorista
                </span>
                <span className="text-sm font-semibold text-red-600">
                  Ver catálogo y precios
                </span>
              </div>

              <button
                onClick={() => {
                  localStorage.setItem("loginMode", "mayorista");
                  setOpenLogin(true);
                }}
                className="px-4 sm:px-5 py-2 rounded-lg text-sm font-semibold text-white
      bg-gradient-to-r from-red-600 to-red-700
      hover:from-red-700 hover:to-red-800
      shadow-lg shadow-red-300/40
      transition-all duration-200"
              >
                <span className="block sm:hidden">Ingresar</span>
                <span className="hidden sm:block">Iniciar sesión</span>
              </button>

            </div>
          ) : (
            <div className="flex items-center gap-3 pl-3 border-l border-red-100">

              {/* USER */}
              <div className="hidden sm:flex items-center gap-2">
                <div className="p-2 bg-red-100 rounded-lg">
                  <User className="w-4 h-4 text-red-600" />
                </div>

                <div className="flex flex-col leading-tight">
                  <span className="text-sm font-medium text-gray-900 max-w-[140px] truncate">
                    {user.email}
                  </span>
                  <span className="text-xs text-gray-500">
                    {roleLabel[user.rol]}
                  </span>
                </div>
              </div>

              <button
                onClick={() => {
                  logout();
                  router.push("/");
                }}
                className="text-sm font-medium text-gray-600 hover:text-red-600 hover:bg-red-50 px-3 py-2 rounded-lg transition-all duration-200"
              >
                Salir
              </button>
            </div>
          )}

        </div>
      </nav>

      <Modal open={openLogin} onClose={() => setOpenLogin(false)}>
        <LoginForm onSuccess={() => setOpenLogin(false)} />
      </Modal>
    </>
  );
}



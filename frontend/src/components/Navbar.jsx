"use client";

import Link from "next/link";
import { ShoppingCart, User, Shield } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSelector, useDispatch } from "react-redux";
import { clearCart } from "../../store/slices/cartSlice";
import { Modal } from "./ui/Modal";
import { LoginForm } from "./auth/LoginForm";
import { useAuth } from "../context/AuthContext";

export function Navbar() {
  const dispatch = useDispatch();
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
      <nav className="bg-gradient-to-l from-red-100 via-red-50 to-white min-h-20 px-4 sm:px-6 lg:px-8 py-3 sm:py-0 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-md border-b border-red-100">

        <Link
          href="/"
          className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-red-600 to-red-800 bg-clip-text text-transparent hover:from-red-700 hover:to-red-900 transition-all"
        >
          Fiorenza 
          Repuestos
        </Link>

        <div className="w-full sm:w-auto flex flex-wrap items-center justify-between sm:justify-end gap-3 sm:gap-8">


          {(user?.rol === "mayorista" || user?.rol === "MAYORISTA") && (
            <Link
              href="/mayorista"
              className="text-sm font-semibold px-3 py-2 text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-all"
            >
              Área mayorista
            </Link>
          )}

          {(user?.rol === "admin" || user?.rol === "ADMIN") && (
            <Link
              href="/admin/dashboard"
              className="flex items-center gap-2 text-sm font-semibold px-3 py-2 text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-all"
            >
              <Shield className="w-4 h-4" />
              Admin
            </Link>
          )}

          {/* CARRITO */}
          {user && user.rol !== "admin" && user.rol !== "ADMIN" && (
            <Link
              href="/dashboard/carrito"
              className="relative p-2 text-gray-700 hover:text-red-600 transition-colors hover:bg-gray-100 rounded-lg"
            >
              <ShoppingCart className="w-6 h-6" />

              {mounted && cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-gradient-to-br from-red-500 to-red-700 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center shadow-lg">
                  {cartCount}
                </span>
              )}
            </Link>
          )}

          {!user ? (
            <button
              onClick={() => setOpenLogin(true)}
              className="btn-primary px-5 sm:px-6 py-2.5"
            >
              Iniciar sesión
            </button>
          ) : (
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-5 sm:pl-5 sm:border-l border-gray-200 w-full sm:w-auto">
              <div className="flex flex-col leading-tight">
                <div className="flex items-center gap-2 text-gray-900">
                  <div className="p-1.5 bg-red-100 rounded-lg">
                    <User className="w-4 h-4 text-red-600" />
                  </div>
                  <span className="text-sm font-semibold break-all">{user.email}</span>
                </div>
                <span className="text-xs text-gray-500 mt-1">
                  {roleLabel[user.rol]}
                </span>
              </div>

              <button
                onClick={() => {
                  dispatch(clearCart());
                  logout();
                  router.push("/");
                }}
                className="text-sm font-medium text-gray-600 hover:text-red-600 hover:bg-red-50 px-3 py-2 rounded-lg transition-all"
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



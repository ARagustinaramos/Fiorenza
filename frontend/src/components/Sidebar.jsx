"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import { useState } from "react";
import {
  Home,
  User,
  ShoppingBag,
  Download,
  Menu,
  X,
} from "lucide-react";

export function Sidebar({ children }) {
  const pathname = usePathname();
  const { user } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const userRole = user?.rol?.toUpperCase() || null;

  const isActive = (path) => pathname === path;

 const getProductsPath = () => {
  if (userRole === "MAYORISTA") return "/mayorista";
  if (userRole === "MINORISTA") return "/";
  return "/";
}

  const menuItems = userRole
    ? [
      { label: "Productos", href: getProductsPath(), icon: Home },
      { label: "Perfil", href: "/dashboard/pefil", icon: User },
      { label: "Pedidos", href: "/dashboard/pedidos", icon: ShoppingBag },
      { label: "Descargas", href: "/dashboard/descargas", icon: Download },
    ].filter(
      (item) =>
        !(userRole === "MINORISTA" && item.href === "/dashboard/descargas")
    )
    : [{ label: "Productos", href: "/", icon: Home }];

  return (
    <>
      {/* MOBILE */}
      <div className="lg:hidden">
        <div className="border-b border-gray-200 bg-white p-4">
          <button
            onClick={() => setMenuOpen(true)}
            className="flex items-center gap-2 text-red-600 hover:text-red-700 transition"
          >
            <Menu className="w-6 h-6" />
            <span className="font-semibold">Menú</span>
          </button>
        </div>

        {/* Filtros (quedan afuera del menú) */}
        {children && (
          <div className="border-b border-gray-200 bg-white px-4 py-3">
            {children}
          </div>
        )}

        {menuOpen && (
          <div
            className="fixed inset-0 z-50 bg-black/50"
            onClick={() => setMenuOpen(false)}
          >
            <div
              className="h-full w-72 bg-white shadow-2xl p-5 flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-gray-900">
                    Menú
                  </h2>

                  {user && (
                    <div className="mt-3 rounded-lg border border-red-100 bg-red-50 p-3">
                      <p className="text-xs text-gray-500">
                        Conectado como
                      </p>

                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {user.email}
                      </p>
                    </div>
                  )}

                  <div className="my-5 border-t border-gray-200" />
                </div>

                <button
                  onClick={() => setMenuOpen(false)}
                  className="ml-4 rounded-lg p-2 hover:bg-gray-100 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <nav className="flex flex-col gap-2">
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.href);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMenuOpen(false)}
                      className={`flex items-center gap-3 rounded-lg px-4 py-3 transition ${active
                          ? "bg-red-600 text-white shadow-md"
                          : "text-gray-700 hover:bg-red-50 hover:text-red-600"
                        }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="font-medium">{item.label}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>
          </div>
        )}
      </div>

      {/* DESKTOP */}
      <aside className="hidden lg:flex w-[260px] min-h-screen bg-gradient-to-b from-red-50 to-gray-50 p-6 flex-col">
        <div className="flex flex-col gap-6 flex-1">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              Mi Perfil
            </h2>

            <p className="text-xs text-gray-500 mt-1">
              Gestioná tu cuenta
            </p>
          </div>

          <nav className="flex flex-col gap-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-lg px-4 py-3 transition ${active
                      ? "bg-red-600 text-white shadow-md"
                      : "text-gray-700 hover:bg-white hover:text-red-600"
                    }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {children && <div className="mt-1">{children}</div>}
        </div>
      </aside>
    </>
  )
}
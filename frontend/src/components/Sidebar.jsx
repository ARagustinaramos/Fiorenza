"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import { Home, User, ShoppingBag, Download } from "lucide-react";

export function Sidebar({ children }) {
  const pathname = usePathname();
  const { user } = useAuth();
  const enableMinorista =
    String(process.env.NEXT_PUBLIC_ENABLE_MINORISTA || "false").toLowerCase() ===
    "true";

  const userRole = user?.rol?.toUpperCase() || null;

  const isActive = (path) => pathname === path;

  const getProductsPath = () => {
    if (userRole === "MAYORISTA") return "/mayorista";
    if (userRole === "MINORISTA") return enableMinorista ? "/" : "/login";
    return "/";
  };

  const menuItems = userRole
    ? [
        { label: "Productos", href: getProductsPath(), icon: Home },
        { label: "Perfil", href: "/dashboard/pefil", icon: User },
        { label: "Pedidos", href: "/dashboard/pedidos", icon: ShoppingBag },
        { label: "Descargas", href: "/dashboard/descargas", icon: Download },
      ].filter((item) => !(userRole === "MINORISTA" && item.href === "/dashboard/descargas"))
    : [{ label: "Productos", href: "/", icon: Home }];

  return (
    <aside className="w-full lg:w-[260px] lg:min-h-screen bg-gradient-to-b from-red-50 to-gray-50 border-b lg:border-b-0 lg:border-r border-gray-200 p-4 sm:p-6 flex flex-col">
      <div className="flex flex-col gap-4 lg:gap-6 flex-1">
        <div className="hidden lg:block">
          <h2 className="text-xl font-bold text-gray-900">Mi Perfil</h2>
          <p className="text-xs text-gray-500 mt-1">Gestiona tu cuenta</p>
        </div>

        <nav className="flex gap-2 overflow-x-auto pb-1 lg:pb-0 lg:flex-col">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex shrink-0 items-center gap-2 sm:gap-3 px-3 sm:px-4 py-3 rounded-lg transition-all ${active
                    ? "bg-red-600 text-white shadow-md"
                    : "text-gray-700 hover:bg-white hover:text-red-600"
                  }`}
              >
                <Icon className="w-5 h-5 shrink-0" />
                <span className="font-medium whitespace-nowrap">{item.label}</span>
              </Link>
            );
          })}
        </nav>
        {children && (
          <div className="mt-1 lg:mt-[2px]">
            {children}
          </div>
        )}
      </div>
    </aside>
  );
}

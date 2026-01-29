"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import { Home, User, ShoppingBag, Download } from "lucide-react";

export function Sidebar({ children }) {
  const pathname = usePathname();
  const { user } = useAuth();

  const userRole = user?.rol?.toUpperCase() || null;

  const isActive = (path) => pathname === path;

  const getProductsPath = () => {
    if (userRole === "MAYORISTA") return "/mayorista";
    if (userRole === "MINORISTA") return "/";
    return "/";
  };

  const menuItems = [
    { label: "Productos", href: getProductsPath(), icon: Home },
    { label: "Perfil", href: "/dashboard/pefil", icon: User },
    { label: "Pedidos", href: "/dashboard/pedidos", icon: ShoppingBag },
    { label: "Descargas", href: "/dashboard/descargas", icon: Download },
  ];

  return (
    <aside className="w-[260px] min-h-screen bg-gradient-to-b from-red-50 to-gray-50 border-r border-gray-200 p-6 flex flex-col">
      <div className="flex flex-col gap-6 flex-1">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Mi Perfil</h2>
          <p className="text-xs text-gray-500 mt-1">Gestiona tu cuenta</p>
        </div>

        <nav className="flex flex-col gap-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${active
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
        {children && (
          <div className="mt-[2px]">
            {children}
          </div>
        )}
      </div>
    </aside>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Users,
  UserPlus,
  Image,
} from "lucide-react";

export default function AdminSidebar() {
  const pathname = usePathname();

  const isActive = (path) => pathname === path;

  const menuItems = [
    { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
    { label: "Actualizar productos", href: "/admin/productos", icon: Package },
    { label: "Pedidos", href: "/admin/pedidos", icon: ShoppingBag },
    { label: "Clientes", href: "/admin/clientes", icon: Users },
    { label: "Nuevo cliente", href: "/admin/clientes/nuevo", icon: UserPlus },
    { label: "Banners", href: "/admin/banners", icon: Image },
  ];

  return (
    <aside className="w-[260px] min-h-screen bg-gradient-to-b from-red-50 to-gray-50 border-r border-gray-200 p-6">
      <div className="flex flex-col gap-6">

        {/* Header */}
        <div className="mb-2">
          <h2 className="text-xl font-bold text-gray-900">Admin Panel</h2>
          <p className="text-xs text-gray-500 mt-1">
            Fiorenza Automotores
          </p>
        </div>

        {/* Menu */}
        <nav className="flex flex-col gap-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                  active
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

        <div className="border-t border-gray-200" />

        {/* Info admin */}
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <p className="text-xs text-gray-500 mb-2">Panel</p>
          <p className="text-sm font-semibold text-gray-900">
            Administrador
          </p>
          <p className="text-xs text-red-600 mt-2">
            Control total
          </p>
        </div>

      </div>
    </aside>
  );
}

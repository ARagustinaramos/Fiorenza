"use client";

import { useEffect, useState } from "react";
import { Package, ShoppingBag, Users, DollarSign } from "lucide-react";

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalProductos: 0,
    pedidosMes: 0,
    clientesActivos: 0,
    ventasMes: 0,
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";
        const token = localStorage.getItem("token");

        if (!token) {
          setError("No hay token de autenticación");
          setLoading(false);
          return;
        }

        const productsRes = await fetch(`${apiUrl}/products?limit=1`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const productsData = await productsRes.json();
        const totalProductos = productsData.pagination?.total || 0;

        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        const ordersParams = new URLSearchParams({
          startDate: startOfMonth.toISOString(),
          limit: 1000,
        });

        const ordersRes = await fetch(`${apiUrl}/orders?${ordersParams.toString()}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const ordersData = await ordersRes.json();
        const orders = ordersData.data || [];

        const pedidosMes = orders.length;
        const ventasMes = orders.reduce((sum, order) => {
          const amount = Number(order?.totalAmount);
          return sum + (Number.isFinite(amount) ? amount : 0);
        }, 0);

        // Obtener usuarios
        const usersRes = await fetch(`${apiUrl}/users`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const usersData = await usersRes.json();
        const users = Array.isArray(usersData) ? usersData : [];
        const clientesActivos = users.filter((user) => user.activo).length;

        setStats({
          totalProductos,
          pedidosMes,
          clientesActivos,
          ventasMes,
        });

        setRecentOrders(orders.slice(0, 4));
      } catch (err) {
        console.error("Error cargando datos del dashboard:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const formatCurrency = (amount) => {
    const numericAmount = Number(amount);
    if (!Number.isFinite(numericAmount) || numericAmount === 0) return "$0,00";
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      maximumFractionDigits: 0,
    }).format(numericAmount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Hace un momento";
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) {
      return `Hace ${diffMins} ${diffMins === 1 ? "minuto" : "minutos"}`;
    } else if (diffHours < 24) {
      return `Hace ${diffHours} ${diffHours === 1 ? "hora" : "horas"}`;
    } else {
      return `Hace ${diffDays} ${diffDays === 1 ? "día" : "días"}`;
    }
  };

  const statsData = [
    {
      label: "Total Productos",
      value: stats.totalProductos.toString(),
      icon: Package,
      color: "bg-red-500",
      change: "",
    },
    {
      label: "Pedidos del Mes",
      value: stats.pedidosMes.toString(),
      icon: ShoppingBag,
      color: "bg-green-500",
      change: "",
    },
    {
      label: "Clientes Activos",
      value: stats.clientesActivos.toString(),
      icon: Users,
      color: "bg-purple-500",
      change: "",
    },
    {
      label: "Ventas del Mes",
      value: formatCurrency(stats.ventasMes),
      icon: DollarSign,
      color: "bg-orange-500",
      change: "",
    },
  ];

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <main className="flex-1 p-8">
          <h1 className="text-3xl font-bold mb-8">Dashboard</h1>
          <div className="text-center py-12">
            <p className="text-gray-600">Cargando datos...</p>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <main className="flex-1 p-8">
          <h1 className="text-3xl font-bold mb-8">Dashboard</h1>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">Error: {error}</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <main className="flex-1 p-8">
        <h1 className="text-3xl font-bold mb-8">Dashboard</h1>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statsData.map((stat, index) => {
            const Icon = stat.icon;

            return (
              <div
                key={index}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`${stat.color} p-3 rounded-lg`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>

                  {stat.change && (
                    <span className="text-sm font-medium text-green-600">
                      {stat.change}
                    </span>
                  )}
                </div>

                <h3 className="text-2xl font-bold text-gray-900 mb-1">
                  {stat.value}
                </h3>
                <p className="text-sm text-gray-600">{stat.label}</p>
              </div>
            );
          })}
        </div>

        {/* Actividad reciente */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-bold mb-6">Actividad Reciente</h2>

          <div className="space-y-4">
            {recentOrders.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No hay actividad reciente</p>
            ) : (
              recentOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                  <div>
                    <p className="font-medium text-gray-900">
                      Pedido #{order.id.slice(0, 8).toUpperCase()}
                    </p>
                    <p className="text-sm text-gray-600">
                      {order.user?.perfil?.nombreCompleto || order.user?.email || "Cliente"} - {formatCurrency(order.totalAmount)}
                    </p>
                  </div>
                  <span className="text-sm text-gray-500">{formatDate(order.createdAt)}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

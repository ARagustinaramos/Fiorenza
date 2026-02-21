"use client";

import { Eye } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../context/AuthContext";

export default function Pedidos() {
  const router = useRouter();
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedOrder, setSelectedOrder] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

  const getProductsPath = () => {
    const userRole = user?.rol?.toUpperCase();
    if (userRole === "MAYORISTA") {
      return "/mayorista";
    }
    return "/";
  };

  const fetchOrders = async ({ silent = false } = {}) => {
    try {
      if (!silent) {
        setLoading(true);
      }
      setError(null);

      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }

      const apiUrl =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";
      const res = await fetch(`${apiUrl}/orders/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        if (res.status === 401) {
          router.push("/login");
          return;
        }
        throw new Error("Error al cargar los pedidos");
      }

      const data = await res.json();
      setOrders(Array.isArray(data) ? data : []);
      setHasLoadedOnce(true);
    } catch (err) {
      console.error("Error fetching orders:", err);
      if (!silent) {
        setError("No se pudieron cargar los pedidos");
      }
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    if (selectedOrder) return;

    const interval = setInterval(() => {
      fetchOrders({ silent: true });
    }, 60000);

    return () => clearInterval(interval);
  }, [selectedOrder]);

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString("es-AR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const formatPrice = (price) => {
    if (!price) return "$0,00";
    return `$${Number(price).toLocaleString("es-AR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const getStatusColor = (status) => {
    const statusMap = {
      PENDING: "bg-yellow-100 text-yellow-800",
      CONFIRMED: "bg-red-100 text-red-800",
      PROCESSING: "bg-red-100 text-red-800",
      SHIPPED: "bg-purple-100 text-purple-800",
      DELIVERED: "bg-green-100 text-green-800",
      CANCELLED: "bg-red-100 text-red-800",
    };
    return statusMap[status] || "bg-gray-100 text-gray-800";
  };

  const getStatusLabel = (status) => {
    const statusMap = {
      PENDING: "Pendiente",
      CONFIRMED: "Confirmado",
      PROCESSING: "En proceso",
      SHIPPED: "Enviado",
      DELIVERED: "Entregado",
      CANCELLED: "Cancelado",
    };
    return statusMap[status] || status;
  };

  const formatOrderNumber = (id) => {
    if (!id) return "-";
    return `#ORD-${id.substring(0, 8).toUpperCase()}`;
  };

  const openOrderDetail = async (orderId) => {
    try {
      setDetailLoading(true);

      const token = localStorage.getItem("token");
      const apiUrl =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

      const res = await fetch(`${apiUrl}/orders/${orderId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error("Error al cargar el detalle");

      const data = await res.json();
      setSelectedOrder(data);
      setLastUpdate(new Date());
    } catch (error) {
      console.error(error);
      alert("No se pudo cargar el detalle del pedido");
    } finally {
      setDetailLoading(false);
    }
  };

 
  useEffect(() => {
    if (!selectedOrder?.id) return;

    const refreshDetail = async () => {
      try {
        const token = localStorage.getItem("token");
        const apiUrl =
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

        const res = await fetch(`${apiUrl}/orders/${selectedOrder.id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (res.ok) {
          const data = await res.json();
          if (data.status !== selectedOrder.status) {
            setSelectedOrder(data);
            setLastUpdate(new Date());
          }
        }
      } catch (error) {
        console.error("Error refreshing order detail:", error);
      }
    };

    const interval = setInterval(refreshDetail, 10000);
    return () => clearInterval(interval);
  }, [selectedOrder?.id, selectedOrder?.status]);

  return (
    <div className="max-w-7xl mx-auto">
            <h1 className="text-4xl font-bold mb-8">Mis Pedidos</h1>

            <div className="bg-white rounded-lg border border-[#D9D9D9] overflow-hidden shadow-sm">
              
              <div className="bg-red-700 text-white grid grid-cols-[150px_120px_150px_1fr_120px_120px] gap-4 px-6 py-4">
                <div className="text-sm font-bold">Número</div>
                <div className="text-sm font-bold">Fecha</div>
                <div className="text-sm font-bold">Estado</div>
                <div className="text-sm font-bold">Items</div>
                <div className="text-sm font-bold">Total</div>
                <div className="text-sm font-bold">Acción</div>
              </div>

              
              {!hasLoadedOnce && loading ? (
                <div className="p-12 text-center text-gray-500">
                  Cargando pedidos...
                </div>
              ) : error ? (
                <div className="p-12 text-center text-red-500">
                  <p>{error}</p>
                  <button
                    onClick={fetchOrders}
                    className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                  >
                    Reintentar
                  </button>
                </div>
              ) : orders.length === 0 ? (
                <div className="p-12 text-center text-gray-500">
                  <p>No tienes pedidos aún</p>
                  <button
                    onClick={() => router.push(getProductsPath())}
                    className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                  >
                    Ver productos
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {orders.map((order) => (
                    <div
                      key={order.id}
                      className="grid grid-cols-[150px_120px_150px_1fr_120px_120px] gap-4 px-6 py-4 items-center hover:bg-gray-50 transition-colors"
                    >
                      <div className="text-sm font-medium text-gray-900">
                        {formatOrderNumber(order.id)}
                      </div>

                      <div className="text-sm text-gray-700">
                        {formatDate(order.createdAt)}
                      </div>

                      <div>
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                            order.status
                          )}`}
                        >
                          {getStatusLabel(order.status)}
                        </span>
                      </div>

                      <div className="text-sm text-gray-700">
                        {order.items?.length || 0} productos
                      </div>

                      <div className="text-sm font-semibold text-gray-900">
                        {formatPrice(order.totalAmount)}
                      </div>

                      <div>
                        <button
                          onClick={() => openOrderDetail(order.id)}
                          className="inline-flex items-center gap-2 px-3 py-2 bg-red-600 text-white text-xs rounded-md hover:bg-red-700 transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                          Ver detalle
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {!loading && !error && (
              <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-lg shadow-sm">
                  <p className="text-sm text-gray-600 mb-2">Total pedidos</p>
                  <p className="text-3xl font-bold">{orders.length}</p>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm">
                  <p className="text-sm text-gray-600 mb-2">En proceso</p>
                  <p className="text-3xl font-bold text-red-600">
                    {
                      orders.filter(
                        (o) =>
                          o.status === "CONFIRMED" ||
                          o.status === "PROCESSING" ||
                          o.status === "SHIPPED"
                      ).length
                    }
                  </p>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm">
                  <p className="text-sm text-gray-600 mb-2">Entregados</p>
                  <p className="text-3xl font-bold text-green-600">
                    {orders.filter((o) => o.status === "DELIVERED").length}
                  </p>
                </div>
              </div>
            )}

      {selectedOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white w-full max-w-2xl rounded-lg shadow-lg p-6 relative">
            <button
              onClick={() => setSelectedOrder(null)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-800"
            >
              ✕
            </button>

            <h2 className="text-2xl font-bold mb-4">
              Pedido {formatOrderNumber(selectedOrder.id)}
            </h2>

            {lastUpdate && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                ✓ Este pedido se sincroniza automáticamente. Última actualización: {lastUpdate.toLocaleTimeString('es-AR')}
              </div>
            )}

            <div className="space-y-2 mb-4">
              <p>
                <strong>Fecha:</strong> {formatDate(selectedOrder.createdAt)}
              </p>
              <p>
                <strong>Estado:</strong>{" "}
                <span
                  className={`px-2 py-1 rounded text-sm ${getStatusColor(
                    selectedOrder.status
                  )}`}
                >
                  {getStatusLabel(selectedOrder.status)}
                </span>
              </p>
              <p>
                <strong>Total:</strong> {formatPrice(selectedOrder.totalAmount)}
              </p>
            </div>

            <div className="border-t my-4" />

            <h3 className="font-semibold mb-2">Productos</h3>

            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {selectedOrder.items.map((item) => (
                <div
                  key={item.id}
                  className="flex justify-between text-sm border-b pb-2"
                >
                  <div>
                    <p className="font-medium">{item.product.descripcion}</p>
                    <p className="text-gray-500">
                      Código: {item.product.codigoInterno}
                    </p>
                    <p className="text-gray-500">Cantidad: {item.quantity}</p>
                  </div>

                  <div className="font-semibold">
                    {formatPrice(item.subtotal)}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 text-right">
              <button
                onClick={() => setSelectedOrder(null)}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

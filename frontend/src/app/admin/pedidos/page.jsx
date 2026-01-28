"use client";

import { useEffect, useState } from "react";
import { Eye, X } from "lucide-react";

export default function AdminPedidos() {
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);

  useEffect(() => {
    fetchPedidos();
  }, []);

  const fetchPedidos = async () => {
    try {
      setLoading(true);
      setError(null);
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";
      const token = localStorage.getItem("token");

      if (!token) {
        setError("No hay token de autenticación");
        return;
      }

      const res = await fetch(`${apiUrl}/orders?limit=100`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error("Error al cargar pedidos");
      }

      const data = await res.json();
      setPedidos(data.data || []);
    } catch (err) {
      console.error("Error cargando pedidos:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrderDetail = async (orderId) => {
    try {
      setDetailLoading(true);
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";
      const token = localStorage.getItem("token");

      const res = await fetch(`${apiUrl}/orders/${orderId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error("Error al cargar detalle del pedido");
      }

      const data = await res.json();
      setSelectedOrder(data);
    } catch (err) {
      console.error("Error:", err);
      alert("No se pudo cargar el detalle del pedido");
    } finally {
      setDetailLoading(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    if (!selectedOrder) return;

    try {
      setStatusUpdating(true);
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";
      const token = localStorage.getItem("token");

      const res = await fetch(`${apiUrl}/orders/${selectedOrder.id}/status`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Error al actualizar estado");
      }

      const updatedOrder = await res.json();
      setSelectedOrder(updatedOrder);

      // Actualizar el estado en la tabla
      setPedidos(
        pedidos.map((p) =>
          p.id === updatedOrder.id ? { ...p, status: updatedOrder.status } : p
        )
      );

      // Recargar pedidos para sincronizar
      setTimeout(() => fetchPedidos(), 500);
    } catch (err) {
      console.error("Error:", err);
      alert(`No se pudo actualizar el estado: ${err.message}`);
    } finally {
      setStatusUpdating(false);
    }
  };

  const getEstadoColor = (estado) => {
    switch (estado) {
      case "COMPLETED":
        return "bg-green-100 text-green-700";
      case "CONFIRMED":
        return "bg-red-100 text-red-700";
      case "PENDING":
        return "bg-yellow-100 text-yellow-700";
      case "CANCELLED":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const formatEstado = (estado) => {
    const estados = {
      PENDING: "Pendiente",
      CONFIRMED: "Confirmado",
      COMPLETED: "Completado",
      CANCELLED: "Cancelado",
    };
    return estados[estado] || estado;
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString("es-AR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const formatCurrency = (amount) => {
    if (!amount) return "$0,00";
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
    }).format(amount);
  };

  const availableStatuses = ["PENDING", "CONFIRMED", "COMPLETED", "CANCELLED"];

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <main className="flex-1 p-8">
          <h1 className="text-3xl font-bold mb-8">Pedidos</h1>
          <div className="text-center py-12">
            <p className="text-gray-600">Cargando pedidos...</p>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <main className="flex-1 p-8">
          <h1 className="text-3xl font-bold mb-8">Pedidos</h1>
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
        <h1 className="text-3xl font-bold mb-8">Pedidos</h1>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                    Número de pedido
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                    Cliente
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                    Fecha
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                    Estado
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                    Total
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                    Acción
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-200">
                {pedidos.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                      No hay pedidos disponibles
                    </td>
                  </tr>
                ) : (
                  pedidos.map((pedido) => (
                    <tr
                      key={pedido.id}
                      className="hover:bg-gray-50 transition"
                    >
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        #{pedido.id.slice(0, 8).toUpperCase()}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {pedido.user?.perfil?.nombreCompleto || pedido.user?.email || "Sin nombre"}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {formatDate(pedido.createdAt)}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${getEstadoColor(
                            pedido.status
                          )}`}
                        >
                          {formatEstado(pedido.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                        {formatCurrency(pedido.totalAmount)}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => fetchOrderDetail(pedido.id)}
                          className="text-[#0D6EFD] hover:text-[#0b5ed7] font-medium text-sm flex items-center gap-1"
                        >
                          <Eye className="w-4 h-4" />
                          Ver
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal de detalle del pedido */}
        {selectedOrder && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              {/* Header */}
              <div className="sticky top-0 bg-gradient-to-r from-red-600 to-red-800 text-white p-6 flex justify-between items-center">
                <h2 className="text-2xl font-bold">
                  Pedido #{selectedOrder.id.slice(0, 8).toUpperCase()}
                </h2>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="text-white hover:bg-white/20 rounded-full p-1 transition"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Contenido */}
              <div className="p-6 space-y-6">
                {/* Información General */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Cliente</p>
                    <p className="font-semibold">
                      {selectedOrder.user?.perfil?.nombreCompleto ||
                        selectedOrder.user?.email ||
                        "Sin nombre"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Fecha</p>
                    <p className="font-semibold">
                      {formatDate(selectedOrder.createdAt)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Total</p>
                    <p className="font-semibold text-lg text-green-700">
                      {formatCurrency(selectedOrder.totalAmount)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Estado</p>
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getEstadoColor(
                        selectedOrder.status
                      )}`}
                    >
                      {formatEstado(selectedOrder.status)}
                    </span>
                  </div>
                </div>

                <div className="border-t pt-6">
                  <p className="text-sm text-gray-600 mb-3 font-semibold">
                    Cambiar Estado
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {availableStatuses.map((status) => (
                      <button
                        key={status}
                        onClick={() => handleStatusChange(status)}
                        disabled={statusUpdating || status === selectedOrder.status}
                        className={`px-4 py-2 rounded text-sm font-medium transition ${
                          status === selectedOrder.status
                            ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                            : "bg-red-100 text-red-700 hover:bg-red-200"
                        } disabled:opacity-50`}
                      >
                        {formatEstado(status)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Productos */}
                <div className="border-t pt-6">
                  <h3 className="font-bold text-lg mb-4">Productos</h3>
                  <div className="space-y-3 max-h-[300px] overflow-y-auto">
                    {selectedOrder.items?.map((item) => (
                      <div
                        key={item.id}
                        className="flex justify-between items-start p-3 bg-gray-50 rounded border border-gray-200"
                      >
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">
                            {item.product?.descripcion}
                          </p>
                          <p className="text-sm text-gray-600">
                            Código: {item.product?.codigoInterno}
                          </p>
                          <p className="text-sm text-gray-600">
                            Cantidad: {item.quantity}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-gray-900">
                            {formatCurrency(item.subtotal)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Resumen */}
                <div className="border-t pt-6 bg-gray-50 p-4 rounded">
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-700">Subtotal:</span>
                    <span className="font-semibold">
                      {formatCurrency(selectedOrder.subtotal || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-700">Impuesto:</span>
                    <span className="font-semibold">
                      {formatCurrency(selectedOrder.tax || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between text-lg font-bold border-t pt-2">
                    <span>Total:</span>
                    <span className="text-green-700">
                      {formatCurrency(selectedOrder.totalAmount)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="border-t p-6 flex justify-end gap-3">
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="px-6 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition font-medium"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { Eye, X } from "lucide-react";

export default function AdminPedidos() {
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedOrder, setSelectedOrder] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState(null);

  const [statusUpdating, setStatusUpdating] = useState(false);
  const [statusError, setStatusError] = useState(null);

  useEffect(() => {
    fetchPedidos();
  }, []);

  const apiUrl =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

  const getToken = () => {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("Sesión expirada");
    return token;
  };

  const fetchPedidos = async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch(`${apiUrl}/orders?limit=100`, {
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      });

      if (!res.ok) throw new Error("No se pudieron cargar los pedidos");

      const data = await res.json();
      setPedidos(data.data || []);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrderDetail = async (id) => {
    try {
      setDetailLoading(true);
      setDetailError(null);

      const res = await fetch(`${apiUrl}/orders/${id}`, {
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      });

      if (!res.ok) throw new Error("No se pudo cargar el pedido");

      const data = await res.json();
      setSelectedOrder(data);
    } catch (err) {
      console.error(err);
      setDetailError(err.message);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      setStatusUpdating(true);
      setStatusError(null);

      const res = await fetch(
        `${apiUrl}/orders/${selectedOrder.id}/status`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${getToken()}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status: newStatus }),
        }
      );

      if (!res.ok) throw new Error("Error al actualizar estado");

      const updated = await res.json();

      setSelectedOrder(updated);
      setPedidos((prev) =>
        prev.map((p) =>
          p.id === updated.id ? { ...p, status: updated.status } : p
        )
      );
    } catch (err) {
      console.error(err);
      setStatusError(err.message);
    } finally {
      setStatusUpdating(false);
    }
  };

  /* ---------------- HELPERS ---------------- */

  const estados = {
    PENDING: "Pendiente",
    CONFIRMED: "Confirmado",
    COMPLETED: "Completado",
    CANCELLED: "Cancelado",
  };

  const estadoColor = (e) =>
    ({
      PENDING: "bg-yellow-100 text-yellow-700",
      CONFIRMED: "bg-red-100 text-red-700",
      COMPLETED: "bg-green-100 text-green-700",
      CANCELLED: "bg-gray-200 text-gray-700",
    }[e] || "bg-gray-100 text-gray-700");

  const formatDate = (d) =>
    d
      ? new Date(d).toLocaleDateString("es-AR")
      : "-";

  const formatCurrency = (n) =>
    new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
    }).format(n || 0);

  const availableStatuses = Object.keys(estados);

  /* ---------------- UI ---------------- */

  if (loading)
    return <p className="p-10 text-gray-600">Cargando pedidos...</p>;

  if (error)
    return (
      <div className="p-10 bg-red-50 text-red-700 rounded">
        {error}
      </div>
    );

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold mb-8">Pedidos</h1>

      <div className="bg-white rounded-lg border overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-100 border-b">
            <tr>
              {["Pedido", "Cliente", "Fecha", "Estado", "Total", "Acción"].map(
                (t) => (
                  <th
                    key={t}
                    className="px-6 py-4 text-left text-sm font-semibold text-gray-700"
                  >
                    {t}
                  </th>
                )
              )}
            </tr>
          </thead>

          <tbody className="divide-y">
            {pedidos.map((p) => (
              <tr key={p.id} className="hover:bg-gray-50 transition">
                <td className="px-6 py-4 font-medium">
                  #{p.id.slice(0, 8).toUpperCase()}
                </td>
                <td className="px-6 py-4">
                  {p.user?.perfil?.nombreCompleto ||
                    p.user?.email}
                </td>
                <td className="px-6 py-4 text-gray-600">
                  {formatDate(p.createdAt)}
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${estadoColor(
                      p.status
                    )}`}
                  >
                    {estados[p.status]}
                  </span>
                </td>
                <td className="px-6 py-4 font-semibold">
                  {formatCurrency(p.totalAmount)}
                </td>
                <td className="px-6 py-4">
                  <button
                    onClick={() => fetchOrderDetail(p.id)}
                    className="text-blue-600 hover:text-blue-800 flex gap-1 items-center"
                  >
                    <Eye className="w-4 h-4" /> Ver
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedOrder && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh] animate-fadeIn">

            {/* HEADER */}
            <div className="flex-shrink-0 bg-gradient-to-r from-red-600 to-red-700 text-white px-6 py-4 flex justify-between">
              <div>
                <p className="text-sm opacity-80">Pedido</p>
                <h2 className="text-2xl font-bold">
                  #{selectedOrder.id.slice(0, 8).toUpperCase()}
                </h2>
              </div>

              <button
                onClick={() => setSelectedOrder(null)}
                className="hover:bg-white/20 p-2 rounded-full transition"
              >
                <X />
              </button>
            </div>

            {/* BODY */}
            <div className="flex-grow p-5 space-y-5 overflow-y-auto">

              {detailLoading && (
                <p className="text-gray-600">Cargando detalle...</p>
              )}

              {detailError && (
                <div className="bg-red-50 text-red-700 p-3 rounded">
                  {detailError}
                </div>
              )}

              {!detailLoading && !detailError && (
                <>
                  {/* INFO GENERAL */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <Info label="Cliente" value={selectedOrder.user?.perfil?.nombreCompleto || selectedOrder.user?.email} />
                    <Info label="Fecha" value={formatDate(selectedOrder.createdAt)} />
                    <Info label="Estado" value={estados[selectedOrder.status]} badge estado={selectedOrder.status} />
                    <Info label="Total" value={formatCurrency(selectedOrder.totalAmount)} highlight />
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4 border">
                    <p className="font-semibold mb-3">
                      Cambiar estado
                    </p>

                    <div className="flex flex-wrap gap-2">
                      {availableStatuses.map((s) => (
                        <button
                          key={s}
                          onClick={() => handleStatusChange(s)}
                          disabled={
                            statusUpdating ||
                            s === selectedOrder.status
                          }
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                            s === selectedOrder.status
                              ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                              : "bg-red-100 text-red-700 hover:bg-red-200"
                          }`}
                        >
                          {estados[s]}
                        </button>
                      ))}
                    </div>

                    {statusError && (
                      <p className="text-sm text-red-600 mt-2">
                        {statusError}
                      </p>
                    )}
                  </div>

                  <div>
                    <h3 className="font-bold text-lg mb-3">
                      Productos
                    </h3>

                    <div className="space-y-3 max-h-[280px] overflow-y-auto pr-2">
                      {selectedOrder.items?.map((item) => (
                        <div
                          key={item.id}
                          className="flex justify-between bg-gray-50 border rounded-lg p-4"
                        >
                          <div>
                            <p className="font-medium">
                              {item.product?.descripcion}
                            </p>
                            <p className="text-sm text-gray-600">
                              Código: {item.product?.codigoInterno}
                            </p>
                            <p className="text-sm text-gray-600">
                              Cantidad: {item.quantity}
                            </p>
                          </div>
                          <p className="font-semibold">
                            {formatCurrency(item.subtotal)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-xl p-4 border space-y-2">
                    <Resumen
                      label="Total"
                      value={formatCurrency(selectedOrder.totalAmount)}
                      total
                    />
                  </div>
                </>
              )}
            </div>

            {/* FOOTER */}
            <div className="flex-shrink-0 border-t p-4 text-right">
              <button
                onClick={() => setSelectedOrder(null)}
                className="px-6 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition"
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



function Info({ label, value, highlight, badge, estado }) {
  const color = estado
    ? ({
        PENDING: "bg-yellow-100 text-yellow-700",
        CONFIRMED: "bg-red-100 text-red-700",
        COMPLETED: "bg-green-100 text-green-700",
        CANCELLED: "bg-gray-200 text-gray-700",
      }[estado] || "")
    : "";

  return (
    <div className="bg-white border rounded-lg p-3">
      <p className="text-sm text-gray-600 mb-1">{label}</p>

      {badge ? (
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${color}`}>
          {value}
        </span>
      ) : (
        <p
          className={`font-semibold ${
            highlight && "text-green-700 text-lg"
          }`}
        >
          {value || "-"}
        </p>
      )}
    </div>
  );
}

function Resumen({ label, value, total }) {
  return (
    <div
      className={`flex justify-between ${
        total && "text-lg font-bold border-t pt-2"
      }`}
    >
      <span>{label}</span>
      <span className={total && "text-green-700"}>{value}</span>
    </div>
  );
}

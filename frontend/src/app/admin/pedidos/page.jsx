"use client";

import { useEffect, useMemo, useState } from "react";
import { Eye, X } from "lucide-react";
import { buildApiUrl } from "../../../lib/api";

const PAGE_SIZE = 20;

const estados = {
  PENDING: "Pendiente",
  CONFIRMED: "Confirmado",
  DESPACHADO: "Despachado",
};

const estadoColor = (estado) =>
  ({
    PENDING: "bg-yellow-100 text-yellow-700",
    CONFIRMED: "bg-red-100 text-red-700",
    DESPACHADO: "bg-emerald-100 text-emerald-700",
  }[estado] || "bg-gray-100 text-gray-700");

const formatDate = (value) =>
  value ? new Date(value).toLocaleDateString("es-AR") : "-";

const formatCurrency = (value) =>
  new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
  }).format(value || 0);

const orderTypeLabel = (type) =>
  String(type || "").toUpperCase() === "MINORISTA" ? "Minorista" : "Mayorista";

const orderTypeBadgeClass = (type) =>
  String(type || "").toUpperCase() === "MINORISTA"
    ? "bg-emerald-100 text-emerald-700"
    : "bg-blue-100 text-blue-700";

const getClientName = (order) =>
  order?.user?.perfil?.nombreCompleto ||
  order?.user?.perfilMinorista?.nombreCompleto ||
  order?.user?.email ||
  "-";

export default function AdminPedidos() {
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [statusError, setStatusError] = useState(null);
  const [shippingSaving, setShippingSaving] = useState(false);
  const [shippingSaveMessage, setShippingSaveMessage] = useState("");
  const [shippingForm, setShippingForm] = useState({
    adminTrackingNumber: "",
    adminShippingCarrier: "",
    adminShippingNotes: "",
  });

  const getToken = () => {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("Sesion expirada");
    return token;
  };

  const syncSelectedOrder = (order) => {
    setSelectedOrder(order);
    setShippingForm({
      adminTrackingNumber: order?.adminTrackingNumber || "",
      adminShippingCarrier: order?.adminShippingCarrier || "",
      adminShippingNotes: order?.adminShippingNotes || "",
    });
    setShippingSaveMessage("");
  };

  const fetchPedidos = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: "1",
        limit: "1000",
      });

      const res = await fetch(buildApiUrl(`/orders?${params.toString()}`), {
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      });

      if (!res.ok) {
        throw new Error("No se pudieron cargar los pedidos");
      }

      const data = await res.json();
      setPedidos(data.data || []);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPedidos();
  }, []);

  const fetchOrderDetail = async (id) => {
    try {
      setDetailLoading(true);
      setDetailError(null);

      const res = await fetch(buildApiUrl(`/orders/${id}`), {
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      });

      if (!res.ok) {
        throw new Error("No se pudo cargar el pedido");
      }

      const data = await res.json();
      syncSelectedOrder(data);
    } catch (err) {
      console.error(err);
      setDetailError(err.message);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    if (!selectedOrder?.id) return;

    try {
      setStatusUpdating(true);
      setStatusError(null);

      let url = buildApiUrl(`/orders/${selectedOrder.id}/status`);
      let method = "PATCH";
      let body = JSON.stringify({ status: newStatus });

      if (newStatus === "CONFIRMED") {
        url = buildApiUrl(`/orders/${selectedOrder.id}/confirm`);
        method = "POST";
        body = null;
      }

      const res = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${getToken()}`,
          ...(body ? { "Content-Type": "application/json" } : {}),
        },
        body,
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        throw new Error(errorData?.error || "Error al actualizar estado");
      }

      const updated = await res.json();
      syncSelectedOrder(updated);
      setPedidos((prev) => prev.map((pedido) => (pedido.id === updated.id ? updated : pedido)));
    } catch (err) {
      console.error(err);
      setStatusError(err.message);
    } finally {
      setStatusUpdating(false);
    }
  };

  const handleShippingFieldChange = (field, value) => {
    setShippingForm((prev) => ({
      ...prev,
      [field]: value,
    }));
    setShippingSaveMessage("");
  };

  const handleSaveShipping = async () => {
    if (!selectedOrder?.id) return;

    try {
      setShippingSaving(true);
      setShippingSaveMessage("");

      const res = await fetch(buildApiUrl(`/orders/${selectedOrder.id}/admin-shipping`), {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify(shippingForm),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        throw new Error(errorData?.error || "No se pudo guardar el seguimiento");
      }

      const updated = await res.json();
      syncSelectedOrder(updated);
      setPedidos((prev) => prev.map((pedido) => (pedido.id === updated.id ? updated : pedido)));
      setShippingSaveMessage(
        updated.status === "DESPACHADO"
          ? "Seguimiento guardado correctamente. El pedido paso a despachado."
          : "Seguimiento guardado correctamente."
      );
    } catch (err) {
      console.error(err);
      setShippingSaveMessage(err.message);
    } finally {
      setShippingSaving(false);
    }
  };

  const filteredPedidos = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return pedidos.filter((pedido) => {
      const orderNumber = `#${pedido.id.slice(0, 8).toUpperCase()}`.toLowerCase();
      const userEmail = (pedido.user?.email || "").toLowerCase();
      const clientName = getClientName(pedido).toLowerCase();

      const matchesSearch =
        !normalizedSearch ||
        orderNumber.includes(normalizedSearch) ||
        userEmail.includes(normalizedSearch) ||
        clientName.includes(normalizedSearch);

      const matchesType =
        typeFilter === "ALL" || String(pedido.type || "").toUpperCase() === typeFilter;

      return matchesSearch && matchesType;
    });
  }, [pedidos, searchTerm, typeFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredPedidos.length / PAGE_SIZE));

  const paginatedPedidos = useMemo(() => {
    const startIndex = (page - 1) * PAGE_SIZE;
    return filteredPedidos.slice(startIndex, startIndex + PAGE_SIZE);
  }, [filteredPedidos, page]);

  useEffect(() => {
    setPage(1);
  }, [searchTerm, typeFilter]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  if (loading) {
    return <p className="p-10 text-gray-600">Cargando pedidos...</p>;
  }

  if (error) {
    return <div className="p-10 bg-red-50 text-red-700 rounded">{error}</div>;
  }

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold mb-8">Pedidos</h1>

      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Buscar por mail, cliente o numero de pedido"
          className="w-full md:max-w-md rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-red-400 focus:outline-none focus:ring-2 focus:ring-red-100"
        />
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-red-400 focus:outline-none focus:ring-2 focus:ring-red-100"
        >
          <option value="ALL">Todos los tipos</option>
          <option value="MAYORISTA">Mayoristas</option>
          <option value="MINORISTA">Minoristas</option>
        </select>
      </div>

      <div className="bg-white rounded-lg border overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-100 border-b">
            <tr>
              {["Pedido", "Tipo", "Cliente", "Fecha", "Estado", "Total", "Accion"].map(
                (title) => (
                  <th
                    key={title}
                    className="px-6 py-4 text-left text-sm font-semibold text-gray-700"
                  >
                    {title}
                  </th>
                )
              )}
            </tr>
          </thead>

          <tbody className="divide-y">
            {paginatedPedidos.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                  No hay pedidos que coincidan con la busqueda.
                </td>
              </tr>
            ) : (
              paginatedPedidos.map((pedido) => (
                <tr key={pedido.id} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4 font-medium">#{pedido.id.slice(0, 8).toUpperCase()}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${orderTypeBadgeClass(
                        pedido.type
                      )}`}
                    >
                      {orderTypeLabel(pedido.type)}
                    </span>
                  </td>
                  <td className="px-6 py-4">{getClientName(pedido)}</td>
                  <td className="px-6 py-4 text-gray-600">{formatDate(pedido.createdAt)}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${estadoColor(
                        pedido.status
                      )}`}
                    >
                      {estados[pedido.status] || pedido.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-semibold">
                    {formatCurrency(pedido.totalAmount)}
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => fetchOrderDetail(pedido.id)}
                      className="text-blue-600 hover:text-blue-800 flex gap-1 items-center"
                    >
                      <Eye className="w-4 h-4" /> Ver
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <p className="text-sm text-gray-600">Total filtrado: {filteredPedidos.length}</p>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
            disabled={loading || page <= 1}
            className="px-4 py-2 rounded-lg border text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
          >
            Anterior
          </button>
          <p className="text-sm text-gray-700">
            Pagina {page} de {totalPages}
          </p>
          <button
            onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
            disabled={loading || page >= totalPages}
            className="px-4 py-2 rounded-lg border text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
          >
            Siguiente
          </button>
        </div>
      </div>

      {selectedOrder && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl flex flex-col max-h-[90vh]">
            <div className="flex-shrink-0 bg-gradient-to-r from-red-600 to-red-700 text-white px-6 py-4 flex justify-between">
              <div>
                <p className="text-sm opacity-80">Pedido</p>
                <h2 className="text-2xl font-bold">#{selectedOrder.id.slice(0, 8).toUpperCase()}</h2>
              </div>

              <button
                onClick={() => setSelectedOrder(null)}
                className="hover:bg-white/20 p-2 rounded-full transition"
              >
                <X />
              </button>
            </div>

            <div className="flex-grow p-5 space-y-5 overflow-y-auto">
              {detailLoading && <p className="text-gray-600">Cargando detalle...</p>}

              {detailError && (
                <div className="bg-red-50 text-red-700 p-3 rounded">{detailError}</div>
              )}

              {!detailLoading && !detailError && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                    <Info label="Cliente" value={getClientName(selectedOrder)} />
                    <Info label="Tipo" value={orderTypeLabel(selectedOrder.type)} />
                    <Info label="Fecha" value={formatDate(selectedOrder.createdAt)} />
                    <Info
                      label="Estado"
                      value={estados[selectedOrder.status] || selectedOrder.status}
                      badge
                      estado={selectedOrder.status}
                    />
                    <Info
                      label="Total"
                      value={formatCurrency(selectedOrder.totalAmount)}
                      highlight
                    />
                  </div>

                  <div className="bg-gray-50 rounded-xl p-4 border">
                    <p className="font-semibold mb-3">Cambiar estado</p>

                    <div className="flex flex-wrap gap-2">
                      {selectedOrder.status === "PENDING" && (
                        <button
                          onClick={() => handleStatusChange("CONFIRMED")}
                          disabled={statusUpdating}
                          className="px-4 py-2 rounded-lg text-sm font-medium transition bg-red-100 text-red-700 hover:bg-red-200 disabled:opacity-60"
                        >
                          {statusUpdating ? "Confirmando..." : "Confirmado"}
                        </button>
                      )}
                      {selectedOrder.status === "CONFIRMED" && (
                        <p className="text-sm text-gray-600">
                          El pedido ya fue confirmado. Al guardar los datos de envio pasara a despachado.
                        </p>
                      )}
                      {selectedOrder.status === "DESPACHADO" && (
                        <p className="text-sm text-gray-600">El pedido ya fue despachado.</p>
                      )}
                    </div>

                    {statusError && <p className="text-sm text-red-600 mt-2">{statusError}</p>}

                    {String(selectedOrder.type || "").toUpperCase() === "MINORISTA" &&
                      (selectedOrder.status === "CONFIRMED" ||
                        selectedOrder.status === "DESPACHADO") && (
                        <div className="mt-4 space-y-3 border-t pt-4">
                          <p className="text-sm font-semibold text-gray-800">
                            Datos de seguimiento para el cliente
                          </p>
                          <input
                            type="text"
                            value={shippingForm.adminTrackingNumber}
                            onChange={(e) =>
                              handleShippingFieldChange("adminTrackingNumber", e.target.value)
                            }
                            placeholder="Numero de seguimiento"
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-red-400 focus:outline-none focus:ring-2 focus:ring-red-100"
                          />
                          <input
                            type="text"
                            value={shippingForm.adminShippingCarrier}
                            onChange={(e) =>
                              handleShippingFieldChange("adminShippingCarrier", e.target.value)
                            }
                            placeholder="Transporte / correo"
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-red-400 focus:outline-none focus:ring-2 focus:ring-red-100"
                          />
                          <textarea
                            rows={3}
                            value={shippingForm.adminShippingNotes}
                            onChange={(e) =>
                              handleShippingFieldChange("adminShippingNotes", e.target.value)
                            }
                            placeholder="Observaciones para el envio"
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-red-400 focus:outline-none focus:ring-2 focus:ring-red-100"
                          />
                          <div className="flex items-center gap-3">
                            <button
                              type="button"
                              onClick={handleSaveShipping}
                              disabled={shippingSaving}
                              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700 disabled:opacity-60"
                            >
                              {shippingSaving ? "Guardando..." : "Guardar seguimiento"}
                            </button>
                            {shippingSaveMessage && (
                              <p
                                className={`text-sm ${
                                  shippingSaveMessage.includes("correctamente")
                                    ? "text-emerald-700"
                                    : "text-red-600"
                                }`}
                              >
                                {shippingSaveMessage}
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                  </div>

                  <div>
                    <h3 className="font-bold text-lg mb-3">Productos</h3>
                    <div className="space-y-3 max-h-[280px] overflow-y-auto pr-2">
                      {selectedOrder.items?.map((item) => (
                        <div
                          key={item.id}
                          className="flex justify-between bg-gray-50 border rounded-lg p-4"
                        >
                          <div>
                            <p className="font-medium">{item.product?.descripcion}</p>
                            <p className="text-sm text-gray-600">
                              Codigo: {item.product?.codigoInterno}
                            </p>
                            <p className="text-sm text-gray-600">Cantidad: {item.quantity}</p>
                          </div>
                          <p className="font-semibold">{formatCurrency(item.subtotal)}</p>
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
  const color = badge ? estadoColor(estado) : "";

  return (
    <div className="min-w-0 bg-white border rounded-lg p-3">
      <p className="text-sm text-gray-600 mb-1">{label}</p>
      {badge ? (
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${color}`}>{value}</span>
      ) : (
        <p className={`font-semibold ${highlight ? "text-green-700 text-lg" : ""} break-all`}>
          {value || "-"}
        </p>
      )}
    </div>
  );
}

function Resumen({ label, value, total }) {
  return (
    <div className={`flex justify-between ${total ? "text-lg font-bold border-t pt-2" : ""}`}>
      <span>{label}</span>
      <span className={total ? "text-green-700" : ""}>{value}</span>
    </div>
  );
}

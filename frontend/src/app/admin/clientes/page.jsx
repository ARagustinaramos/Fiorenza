"use client";

import { useEffect, useState } from "react";
import { Eye, X, Toggle2 } from "lucide-react";
import { useSearchParams } from "next/navigation";

export default function AdminClientes() {
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCliente, setSelectedCliente] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [togglingStatus, setTogglingStatus] = useState(false);
  const searchParams = useSearchParams();
  const refresh = searchParams.get("refresh");


  useEffect(() => {
  fetchClientes();
}, [refresh]);

  const fetchClientes = async () => {
    try {
      setLoading(true);
      setError(null);
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";
      const token = localStorage.getItem("token");

      if (!token) {
        setError("No hay token de autenticación");
        return;
      }

      const res = await fetch(`${apiUrl}/users`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error("Error al cargar clientes");
      }

      const data = await res.json();
      setClientes(data || []);
    } catch (err) {
      console.error("Error cargando clientes:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchClienteDetail = async (clienteId) => {
    try {
      setDetailLoading(true);
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";
      const token = localStorage.getItem("token");

      const res = await fetch(`${apiUrl}/users/${clienteId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error("Error al cargar detalle del cliente");
      }

      const data = await res.json();
      setSelectedCliente(data);
    } catch (err) {
      console.error("Error:", err);
      alert("No se pudo cargar el detalle del cliente");
    } finally {
      setDetailLoading(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!selectedCliente) return;

    try {
      setTogglingStatus(true);
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";
      const token = localStorage.getItem("token");

      const res = await fetch(`${apiUrl}/users/${selectedCliente.id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ activo: !selectedCliente.activo }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Error al actualizar estado");
      }

      const updatedCliente = await res.json();
      setSelectedCliente(updatedCliente);

      // Actualizar en la lista
      setClientes(
        clientes.map((c) =>
          c.id === updatedCliente.id ? { ...c, activo: updatedCliente.activo } : c
        )
      );

      // Recargar clientes para sincronizar
      setTimeout(() => fetchClientes(), 500);
    } catch (err) {
      console.error("Error:", err);
      alert(`Error: ${err.message}`);
    } finally {
      setTogglingStatus(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <main className="flex-1 p-8">
          <h1 className="text-3xl font-bold mb-8">Clientes</h1>
          <div className="text-center py-12">
            <p className="text-gray-600">Cargando clientes...</p>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <main className="flex-1 p-8">
          <h1 className="text-3xl font-bold mb-8">Clientes</h1>
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
        <h1 className="text-3xl font-bold mb-8">Clientes</h1>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                    Nombre
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                    Email
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                    Teléfono
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                    Tipo de cliente
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                    Estado
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                    Acción
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-200">
                {clientes.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                      No hay clientes disponibles
                    </td>
                  </tr>
                ) : (
                  clientes.map((cliente) => (
                    <tr key={cliente.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {cliente.perfil?.nombreCompleto || "Sin nombre"}
                      </td>

                      <td className="px-6 py-4 text-sm text-gray-600">
                        {cliente.email}
                      </td>

                      <td className="px-6 py-4 text-sm text-gray-600">
                        {cliente.perfil?.telefono || "-"}
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            cliente.rol === "MAYORISTA"
                              ? "bg-purple-100 text-purple-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {cliente.rol === "MAYORISTA" ? "Mayorista" : cliente.rol === "MINORISTA" ? "Minorista" : cliente.rol}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            cliente.activo
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {cliente.activo ? "Activo" : "Inactivo"}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <button
                          onClick={() => fetchClienteDetail(cliente.id)}
                          className="text-[#DC2626] hover:text-[#991b1b] font-medium text-sm flex items-center gap-1"
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

        {/* Modal de detalle del cliente */}
        {selectedCliente && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              {/* Header */}
              <div className="sticky top-0 bg-gradient-to-r from-red-600 to-red-800 text-white p-6 flex justify-between items-center">
                <h2 className="text-2xl font-bold">
                  {selectedCliente.perfil?.nombreCompleto || selectedCliente.email}
                </h2>
                <button
                  onClick={() => setSelectedCliente(null)}
                  className="text-white hover:bg-white/20 rounded-full p-1 transition"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Contenido */}
              <div className="p-6 space-y-6">
                {/* Información Personal */}
                <div>
                  <h3 className="text-lg font-bold mb-4 text-gray-900">Información Personal</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Nombre Completo</p>
                      <p className="font-semibold">
                        {selectedCliente.perfil?.nombreCompleto || "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Email</p>
                      <p className="font-semibold">{selectedCliente.email}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Teléfono</p>
                      <p className="font-semibold">
                        {selectedCliente.perfil?.telefono || "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Tipo de Cliente</p>
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                          selectedCliente.rol === "MAYORISTA"
                            ? "bg-purple-100 text-purple-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {selectedCliente.rol === "MAYORISTA"
                          ? "Mayorista"
                          : selectedCliente.rol === "MINORISTA"
                          ? "Minorista"
                          : selectedCliente.rol}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Información Empresarial */}
                <div className="border-t pt-6">
                  <h3 className="text-lg font-bold mb-4 text-gray-900">Información Empresarial</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Empresa</p>
                      <p className="font-semibold">
                        {selectedCliente.perfil?.empresa || "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">CUIT/CUIL</p>
                      <p className="font-semibold">
                        {selectedCliente.perfil?.cuitCuil || "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Cargo</p>
                      <p className="font-semibold">
                        {selectedCliente.perfil?.cargo || "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Coeficiente</p>
                      <p className="font-semibold">
                        {selectedCliente.coeficiente || "0"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Estado del Cliente */}
                <div className="border-t pt-6">
                  <h3 className="text-lg font-bold mb-4 text-gray-900">Estado del Cliente</h3>
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Activar/Desactivar Cliente</p>
                      <p
                        className={`font-semibold ${
                          selectedCliente.activo
                            ? "text-green-700"
                            : "text-red-700"
                        }`}
                      >
                        {selectedCliente.activo ? "✓ Cliente Activo" : "✗ Cliente Inactivo"}
                      </p>
                    </div>
                    <button
                      onClick={handleToggleStatus}
                      disabled={togglingStatus}
                      className={`relative inline-flex h-10 w-16 items-center rounded-full transition ${
                        selectedCliente.activo
                          ? "bg-green-500"
                          : "bg-red-500"
                      } ${togglingStatus ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:opacity-90"}`}
                    >
                      <span
                        className={`inline-block h-8 w-8 transform rounded-full bg-white transition ${
                          selectedCliente.activo ? "translate-x-7" : "translate-x-1"
                        }`}
                      />
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    {togglingStatus
                      ? "Actualizando estado..."
                      : selectedCliente.activo
                      ? "El cliente puede acceder a la plataforma"
                      : "El cliente no puede acceder a la plataforma"}
                  </p>
                </div>
              </div>

              {/* Footer */}
              <div className="border-t p-6 flex justify-end gap-3">
                <button
                  onClick={() => setSelectedCliente(null)}
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
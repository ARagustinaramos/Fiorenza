"use client";

import { useSelector, useDispatch } from "react-redux";
import { useRouter } from "next/navigation";
import { useAuth } from "../../context/AuthContext";
import { removeFromCart, updateQuantity, clearCart } from "../../../store/slices/cartSlice";
import { Trash2, Plus, Minus, ArrowLeft } from "lucide-react";
import { useState } from "react";

export function CartContent() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { user } = useAuth();
  const cartItems = useSelector((state) => state.cart.items || []);
  const [isProcessing, setIsProcessing] = useState(false);

  const subtotal = cartItems.reduce(
    (total, item) => total + item.precioUnitario * item.cantidad,
    0
  );

  const handleRemoveItem = (id) => {
    dispatch(removeFromCart(id));
  };

  const handleUpdateQuantity = (id, newQuantity) => {
    if (newQuantity < 1) return;
    dispatch(updateQuantity({ id, cantidad: newQuantity }));
  };

  const handleCheckout = async () => {
    if (!user) {
      router.push("/login");
      return;
    }

    setIsProcessing(true);

    try {
      const token = localStorage.getItem("token");
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

      const orderData = {
        items: cartItems.map((item) => ({
          productoId: item.id,
          cantidad: item.cantidad,
          precioUnitario: item.precioUnitario,
        })),
        estado: "PENDIENTE",
      };

      const res = await fetch(`${apiUrl}/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(orderData),
      });

      if (res.ok) {
        dispatch(clearCart());
        router.push("/dashboard/pedidos?success=true");
      } else {
        alert("Error al crear el pedido");
      }
    } catch (error) {
      console.error("Error en checkout:", error);
      alert("Error al procesar el pedido");
    } finally {
      setIsProcessing(false);
    }
  };

  if (cartItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Tu Carrito</h1>
        <p className="text-gray-600 text-lg mb-8">Tu carrito está vacío</p>
        <button
          onClick={() => router.push("/")}
          className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Volver a Productos
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Tu Carrito</h1>
        <p className="text-gray-600 text-sm">{cartItems.length} producto(s)</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* TABLA DE PRODUCTOS */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg border overflow-hidden">
            <div className="bg-red-900 text-white grid grid-cols-[100px_1fr_120px_100px_80px] px-6 py-4 font-semibold">
              <div>Código</div>
              <div>Descripción</div>
              <div>Precio Unit.</div>
              <div>Cantidad</div>
              <div></div>
            </div>

            <div className="divide-y">
              {cartItems.map((item) => (
                <div
                  key={item.id}
                  className="grid grid-cols-[100px_1fr_120px_100px_80px] px-6 py-4 items-center hover:bg-gray-50"
                >
                  <div className="font-mono text-sm text-gray-600">{item.codigo}</div>

                  <div>
                    <p className="font-medium text-gray-900">{item.nombre}</p>
                  </div>

                  <div className="text-right">
                    ${Number(item.precioUnitario).toLocaleString("es-AR", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </div>

                  <div className="flex items-center gap-2 justify-center">
                    <button
                      onClick={() =>
                        handleUpdateQuantity(item.id, item.cantidad - 1)
                      }
                      className="p-1 hover:bg-gray-200 rounded transition-colors"
                    >
                      <Minus className="w-4 h-4 text-gray-600" />
                    </button>
                    <input
                      type="number"
                      min="1"
                      value={item.cantidad}
                      onChange={(e) =>
                        handleUpdateQuantity(item.id, parseInt(e.target.value))
                      }
                      className="w-12 text-center border border-gray-300 rounded px-2 py-1"
                    />
                    <button
                      onClick={() =>
                        handleUpdateQuantity(item.id, item.cantidad + 1)
                      }
                      className="p-1 hover:bg-gray-200 rounded transition-colors"
                    >
                      <Plus className="w-4 h-4 text-gray-600" />
                    </button>
                  </div>

                  <div className="text-right">
                    <button
                      onClick={() => handleRemoveItem(item.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => router.push("/")}
            className="mt-4 flex items-center gap-2 text-red-600 hover:text-red-700 font-medium text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Continuar Comprando
          </button>
        </div>

        {/* RESUMEN */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg border p-5 h-fit sticky top-24">
            <h2 className="text-lg font-bold text-gray-900 mb-5">Resumen</h2>

            <div className="space-y-3 mb-5 pb-5 border-b">
              <div className="flex justify-between text-gray-600 text-sm">
                <span>Subtotal:</span>
                <span>
                  ${Number(subtotal).toLocaleString("es-AR", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>

              <div className="text-xl font-bold text-gray-900 flex justify-between">
                <span>Total:</span>
                <span>
                  ${Number(subtotal).toLocaleString("es-AR", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>
            </div>

            <button
              onClick={handleCheckout}
              disabled={isProcessing}
              className="w-full bg-green-600 text-white font-semibold py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mb-2 text-sm"
            >
              {isProcessing ? "Procesando..." : "Confirmar Pedido"}
            </button>

            <button
              onClick={() => dispatch(clearCart())}
              className="w-full border border-gray-300 text-gray-700 font-semibold py-2 rounded-lg hover:bg-gray-50 transition-colors text-sm"
            >
              Limpiar Carrito
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

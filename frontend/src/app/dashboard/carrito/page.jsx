"use client";

import { Trash2 } from "lucide-react";
import { useSelector, useDispatch } from "react-redux";
import {
  removeFromCart,
  updateQuantity,
  clearCart,
} from "../../../../store/slices/cartSlice";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "../../../context/AuthContext";

export default function Carrito() {
  const dispatch = useDispatch();
  const router = useRouter();
  const { user } = useAuth();

  const cartItems = useSelector((state) => state.cart.items);

  const [mounted, setMounted] = useState(false);

  const getProductsPath = () => {
    const userRole = user?.rol?.toUpperCase();
    if (userRole === "MAYORISTA") {
      return "/mayorista";
    }
    return "/";
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleQuantityChange = (id, newQuantity) => {
    if (newQuantity < 1) return;
    dispatch(updateQuantity({ id, cantidad: newQuantity }));
  };

  const handleRemoveItem = (id) => {
    dispatch(removeFromCart(id));
  };

  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.precioUnitario * item.cantidad,
    0
  );

  const envio = 0;
  const total = subtotal + envio;

  const formatPrice = (price) => {
    return `$${price.toLocaleString("es-AR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const handleCreateOrder = async () => {
    if (cartItems.length === 0) return;

    const userRole = user?.rol?.toUpperCase();
    const orderType = userRole === "MAYORISTA" ? "MAYORISTA" : "MINORISTA";

    try {
      const payload = {
        type: orderType,
        items: cartItems.map((item) => ({
          productId: item.id, // 👈 ID real del producto
          quantity: item.cantidad,
        })),
      };

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";
      const res = await fetch(`${apiUrl}/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: "Error desconocido" }));
        console.error("Error del servidor:", errorData);
        throw new Error(errorData.error || "Error al crear el pedido");
      }

      const order = await res.json();

      // 🧹 vaciar carrito
      dispatch(clearCart());

      // ➜ ir a mis pedidos
      router.push("/dashboard/pedidos");
    } catch (error) {
      console.error(error);
      alert("No se pudo enviar el pedido");
    }
  };

  if (!mounted) return null;

  return (
    <>
      {/* Título */}
      <div className="bg-white py-6 px-4 md:px-8 text-center border-b">
        <h1 className="text-3xl font-bold mb-2">Tu Carrito</h1>
        <p className="text-gray-600">
          Revisá tus productos antes de enviar el pedido
        </p>
      </div>

      <div className="bg-gray-50 py-6 px-4 md:px-8">
        <div className="max-w-[1360px] mx-auto flex flex-col lg:flex-row gap-6 items-start">

          {/* ================= IZQUIERDA: TABLA ================= */}
          <div className="flex-1 w-full">
            <div className="bg-white rounded-lg border border-[#D9D9D9] overflow-hidden shadow-sm">

              <div className="bg-[#1E3A8A] text-white grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr] px-6 py-3">
                <div className="font-bold">Producto</div>
                <div className="font-bold">Código</div>
                <div className="font-bold">Cantidad</div>
                <div className="font-bold">Precio Unitario</div>
                <div className="font-bold">Total</div>
                <div className="font-bold">Acción</div>
              </div>

              <div className="divide-y">
                {cartItems.map((item) => (
                  <div
                    key={item.id}
                    className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr] px-6 py-4 items-center hover:bg-gray-50"
                  >
                    <div>{item.nombre}</div>
                    <div className="text-gray-500">{item.codigo}</div>

                    <input
                      type="number"
                      min="1"
                      value={item.cantidad}
                      onChange={(e) =>
                        handleQuantityChange(item.id, Number(e.target.value))
                      }
                      className="w-16 border rounded text-center"
                    />

                    <div>{formatPrice(item.precioUnitario)}</div>
                    <div className="font-bold">
                      {formatPrice(item.precioUnitario * item.cantidad)}
                    </div>

                    <button
                      onClick={() => handleRemoveItem(item.id)}
                      className="text-red-600 text-xs flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" /> Eliminar
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* SEGUIR COMPRANDO */}
            <div className="mt-4">
              <button
                onClick={() => router.push(getProductsPath())}
                className="text-[#0D6EFD] font-medium hover:underline"
              >
                ← Seguir comprando
              </button>
            </div>
          </div>
          <div className="w-full lg:w-[280px] bg-white border rounded-xl p-6 shadow-sm lg:sticky lg:top-6">
            <h2 className="text-xl font-bold mb-4">Resumen del pedido</h2>

            <div className="space-y-4">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>Envío</span>
                <span>A coordinar</span>
              </div>
            </div>

            <div className="border-t my-4" />

            <div className="flex justify-between mb-6">
              <span className="font-bold">Total</span>
              <span className="text-xl font-bold text-[#0D6EFD]">
                {formatPrice(total)}
              </span>
            </div>

            <button
              onClick={handleCreateOrder}
              className="w-full bg-[#0D6EFD] text-white py-3 rounded-lg"
            >
              Enviar pedido
            </button>
          </div>

        </div>
      </div>


    </>
  );
}

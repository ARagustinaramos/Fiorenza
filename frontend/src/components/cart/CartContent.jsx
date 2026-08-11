"use client";

import { useSelector, useDispatch } from "react-redux";
import { useRouter } from "next/navigation";
import { useAuth } from "../../context/AuthContext";
import { removeFromCart, updateQuantity, clearCart, normalizeCart } from "../../../store/slices/cartSlice";
import { Trash2, Plus, Minus, ArrowLeft } from "lucide-react";
import { useState, useEffect } from "react";
import { CartMobile } from "./CartMobile";

export function CartContent() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { user } = useAuth();
  const cartItems = useSelector((state) => state.cart.items || []);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    // Ensure persisted items have normalized brand data after reload
    try {
      dispatch(normalizeCart());
    } catch (e) {
      // ignore
    }
  }, [dispatch]);

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
    <div className="max-w-[1400px] mx-auto px-8">

      {/* HEADER */}
      <div className="bg-transparent">
        <h1 className="text-3xl font-bold text-gray-900">Tu Carrito</h1>
        <p className="mt-1 text-sm text-gray-500">{cartItems.length} producto(s)</p>
      </div>

      <div className="md:hidden mt-4">
        <CartMobile
          cartItems={cartItems}
          handleUpdateQuantity={handleUpdateQuantity}
          handleRemoveItem={handleRemoveItem}
          formatPrice={(price) =>
            `$${Number(price).toLocaleString("es-AR", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}`
          }
        />
      </div>

{/* ================= TABLA DE PRODUCTOS ================= */}

<div className="w-full min-w-0">

  {/* CONTENEDOR DE LA TABLA */}
  <div className="w-full overflow-hidden rounded-lg border border-gray-200 bg-white">

    {/* ================= HEADER ================= */}
    <div
      className="
        grid
        grid-cols-[minmax(0,2.4fr)_0.8fr_1fr_1.2fr_1.5fr_45px]
        items-center
        bg-red-700
        px-5
        py-3
        text-sm
        font-semibold
        uppercase
        tracking-wide
        text-white
      "
    >
      <div>
        Producto
      </div>

      <div className="text-center">
        Marca
      </div>

      <div className="text-center">
        Código
      </div>

      <div className="text-right">
        Precio
      </div>

      <div className="text-center">
        Cantidad
      </div>

      <div></div>
    </div>


    {/* ================= PRODUCTOS ================= */}
    <div className="divide-y divide-gray-200">

      {cartItems.map((item) => (

        <div
          key={item.id}
          className="
            grid
            grid-cols-[minmax(0,2.4fr)_0.8fr_1fr_1.2fr_1.5fr_45px]
            items-center
            px-5
            py-5
            transition-colors
            hover:bg-gray-50
          "
        >

          {/* ================= PRODUCTO ================= */}
          <div className="min-w-0 pr-4">

            <p
              className="
                text-[15px]
                font-semibold
                leading-5
                text-gray-900
              "
            >
              {item.nombre}
            </p>

          </div>


          {/* ================= MARCA ================= */}
          <div className="min-w-0 px-1 text-center">

            <span
              className="
                block
                text-sm
                text-gray-600
                break-words
              "
            >
              {item.marca ||
                (typeof item.producto?.marca === "string"
                  ? item.producto.marca
                  : item.producto?.marca?.nombre ||
                    item.producto?.marca?.label) ||
                "-"}
            </span>

          </div>


          {/* ================= CÓDIGO ================= */}
          <div className="min-w-0 px-1 text-center">

            <span
              className="
                inline-block
                max-w-full
                rounded
                bg-gray-100
                px-2
                py-1
                font-mono
                text-xs
                text-gray-600
                whitespace-normal
                break-all
              "
            >
              {item.codigo || "-"}
            </span>

          </div>


          {/* ================= PRECIO ================= */}
          <div className="min-w-0 text-right">

            <span
              className="
                text-sm
                font-semibold
                text-gray-900
                whitespace-nowrap
              "
            >
              $
              {Number(item.precioUnitario).toLocaleString("es-AR", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>

          </div>


          {/* ================= CANTIDAD ================= */}
          <div className="flex items-center justify-center gap-1">

            <button
              onClick={() =>
                handleUpdateQuantity(
                  item.id,
                  item.cantidad - 1
                )
              }
              className="
                flex
                h-7
                w-7
                shrink-0
                items-center
                justify-center
                rounded-md
                hover:bg-gray-200
                transition
              "
            >
              <Minus className="h-4 w-4 text-gray-600" />
            </button>


            <input
              type="number"
              min="1"
              value={item.cantidad}
              onChange={(e) =>
                handleUpdateQuantity(
                  item.id,
                  parseInt(e.target.value)
                )
              }
              className="
                h-8
                w-11
                shrink-0
                rounded-md
                border
                border-gray-300
                px-1
                text-center
                text-sm
                focus:border-red-500
                focus:outline-none
                focus:ring-1
                focus:ring-red-500
              "
            />


            <button
              onClick={() =>
                handleUpdateQuantity(
                  item.id,
                  item.cantidad + 1
                )
              }
              className="
                flex
                h-7
                w-7
                shrink-0
                items-center
                justify-center
                rounded-md
                hover:bg-gray-200
                transition
              "
            >
              <Plus className="h-4 w-4 text-gray-600" />
            </button>

          </div>


          {/* ================= ELIMINAR ================= */}
          <div className="flex justify-center">

            <button
              onClick={() => handleRemoveItem(item.id)}
              className="
                flex
                h-8
                w-8
                items-center
                justify-center
                rounded-full
                text-red-600
                transition
                hover:bg-red-50
              "
              title="Eliminar producto"
            >
              <Trash2 className="h-4 w-4" />
            </button>

          </div>

        </div>

      ))}

    </div>

  </div>


  {/* ================= CONTINUAR COMPRANDO ================= */}

  <button
    onClick={() => router.push("/")}
    className="
      mt-5
      flex
      items-center
      gap-2
      text-sm
      font-medium
      text-red-600
      transition
      hover:text-red-700
    "
  >
    <ArrowLeft className="h-4 w-4" />
    Continuar Comprando
  </button>

</div>
          {/* RESUMEN */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm p-5 h-fit sticky top-24">
              <h2 className="text-lg font-bold text-gray-900 mb-5">Resumen</h2>

              <div className="space-y-3 mb-5 pb-5 border-b border-gray-100">
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
                className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed mb-2 text-sm"
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
  )}
 
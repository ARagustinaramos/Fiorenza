"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "../../../../context/AuthContext";
import { useDispatch } from "react-redux";
import { clearCart } from "../../../../../store/slices/cartSlice";

const WHATSAPP_NUMBER = "5491153444546";
const REDIRECT_SECONDS = 12;

export default function ConfirmacionPagoPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useDispatch();
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [countdown, setCountdown] = useState(REDIRECT_SECONDS);
  const [loadingOrder, setLoadingOrder] = useState(true);

  const requestedOrderId = searchParams.get("orderId");
  const paymentStatus = searchParams.get("mp_status");

  useEffect(() => {
    dispatch(clearCart());
  }, [dispatch]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          router.replace("/dashboard/pedidos");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [router]);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          setLoadingOrder(false);
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
          setLoadingOrder(false);
          return;
        }

        const data = await res.json();
        setOrders(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Error cargando pedidos para confirmacion:", error);
      } finally {
        setLoadingOrder(false);
      }
    };

    fetchOrders();
  }, []);

  const selectedOrder = useMemo(() => {
    if (!orders.length) return null;

    if (requestedOrderId) {
      const exactOrder = orders.find((order) => order.id === requestedOrderId);
      if (exactOrder) return exactOrder;
    }

    return orders[0] || null;
  }, [orders, requestedOrderId]);

  const orderNumber = selectedOrder?.id
    ? `#ORD-${selectedOrder.id.substring(0, 8).toUpperCase()}`
    : "tu pedido";
  const userEmail = user?.email || "sin email";

  const whatsappMessage = `Hola, acabo de realizar una compra. Mi numero de pedido es ${orderNumber} y mi mail es ${userEmail}. Quisiera coordinar el envio.`;
  const whatsappLink = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
    whatsappMessage
  )}`;

  const title =
    paymentStatus === "pending"
      ? "Tu pago quedo pendiente"
      : "Pago realizado con exito";
  const description =
    paymentStatus === "pending"
      ? "En cuanto Mercado Pago confirme el pago, vas a ver el pedido actualizado en tu panel."
      : "Contactate con nosotros para coordinar el envio de tu compra.";

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-2xl rounded-3xl border border-green-100 bg-white p-8 shadow-xl">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-3xl text-green-700">
          {paymentStatus === "pending" ? "!" : "OK"}
        </div>

        <h1 className="text-center text-3xl font-bold text-gray-900">
          {title}
        </h1>
        <p className="mt-3 text-center text-base text-gray-600">
          {description}
        </p>

        <div className="mt-6 rounded-2xl border border-gray-200 bg-gray-50 p-5 text-sm text-gray-700">
          <p>
            <span className="font-semibold text-gray-900">Pedido:</span>{" "}
            {loadingOrder ? "Buscando..." : orderNumber}
          </p>
          <p className="mt-2 break-all">
            <span className="font-semibold text-gray-900">Mail:</span>{" "}
            {userEmail}
          </p>
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <a
            href={whatsappLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 rounded-xl bg-green-600 px-5 py-3 text-center font-semibold text-white transition hover:bg-green-700"
          >
            Abrir WhatsApp
          </a>
          <Link
            href="/dashboard/pedidos"
            className="flex-1 rounded-xl border border-gray-300 px-5 py-3 text-center font-semibold text-gray-700 transition hover:bg-gray-50"
          >
            Ir a mis pedidos
          </Link>
        </div>

        <p className="mt-6 text-center text-sm text-gray-500">
          Seras redirigido automaticamente a tus pedidos en {countdown} segundos.
        </p>
      </div>
    </div>
  );
}


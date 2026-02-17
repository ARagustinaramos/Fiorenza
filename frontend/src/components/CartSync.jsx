"use client";

import { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useAuth } from "../context/AuthContext";
import { setCartFromServer } from "../../store/slices/cartSlice";

export function CartSync() {
  const dispatch = useDispatch();
  const { user, loading } = useAuth();
  const cartItems = useSelector((state) => state.cart.items || []);
  const isHydratingRef = useRef(false);
  const isReadyToSyncRef = useRef(false);
  const skipNextSyncRef = useRef(false);

  useEffect(() => {
    if (loading) return;

    if (!user?.id) {
      isReadyToSyncRef.current = false;
      isHydratingRef.current = false;
      skipNextSyncRef.current = false;
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) return;

    let isCancelled = false;
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

    const hydrate = async () => {
      isHydratingRef.current = true;
      isReadyToSyncRef.current = false;

      try {
        const res = await fetch(`${apiUrl}/cart`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) return;

        const data = await res.json();
        if (isCancelled) return;

        const items = Array.isArray(data?.items) ? data.items : [];
        skipNextSyncRef.current = true;
        dispatch(setCartFromServer(items));
      } catch (error) {
        console.error("Error al hidratar carrito:", error);
      } finally {
        isHydratingRef.current = false;
        isReadyToSyncRef.current = true;
      }
    };

    hydrate();

    return () => {
      isCancelled = true;
    };
  }, [dispatch, loading, user?.id]);

  useEffect(() => {
    if (!user?.id || loading) return;
    if (!isReadyToSyncRef.current || isHydratingRef.current) return;

    if (skipNextSyncRef.current) {
      skipNextSyncRef.current = false;
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) return;

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";
    const payload = {
      items: cartItems.map((item) => ({
        productId: item.id,
        quantity: item.cantidad,
      })),
    };

    const sync = async () => {
      try {
        await fetch(`${apiUrl}/cart`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });
      } catch (error) {
        console.error("Error al sincronizar carrito:", error);
      }
    };

    sync();
  }, [cartItems, loading, user?.id]);

  return null;
}

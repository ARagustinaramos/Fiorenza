"use client";

import { buildApiUrl } from "./api";

const PENDING_CART_PRODUCT_KEY = "pendingCartProduct";
const PENDING_CART_SYNCED_KEY = "pendingCartJustSynced";

const toCartPayloadItem = (product) => ({
  productId: product.id,
  quantity: Number(product.cantidad || product.quantity || 1),
});

export const savePendingCartProduct = (product) => {
  if (typeof window === "undefined" || !product?.id) return;
  localStorage.setItem(PENDING_CART_PRODUCT_KEY, JSON.stringify(product));
};

export const getPendingCartProduct = () => {
  if (typeof window === "undefined") return null;

  try {
    const raw = localStorage.getItem(PENDING_CART_PRODUCT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const clearPendingCartProduct = () => {
  if (typeof window === "undefined") return;
  localStorage.removeItem(PENDING_CART_PRODUCT_KEY);
};

export const consumePendingCartProduct = async ({ token }) => {
  const pendingProduct = getPendingCartProduct();
  if (!pendingProduct?.id || !token) return null;

  const cartRes = await fetch(buildApiUrl("/cart"), {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const cartData = cartRes.ok ? await cartRes.json().catch(() => ({})) : {};
  const currentItems = Array.isArray(cartData?.items) ? cartData.items : [];
 
console.log("1 - currentItems", currentItems);

const itemMap = new Map(
  currentItems.map((item) => [
    item.id,
    {
      productId: item.id,
      quantity: Number(item.cantidad || 1),
    },
  ])
);

console.log("2 - itemMap", itemMap);

const pendingItem = toCartPayloadItem(pendingProduct);

console.log("3 - pendingItem", pendingItem);

const existingItem = itemMap.get(pendingItem.productId);

console.log("4 - existingItem", existingItem);

itemMap.set(pendingItem.productId, {
  productId: pendingItem.productId,
  quantity: existingItem
    ? existingItem.quantity + pendingItem.quantity
    : pendingItem.quantity,
});

console.log("5 - payload", Array.from(itemMap.values()));

  const updateRes = await fetch(buildApiUrl("/cart"), {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      items: Array.from(itemMap.values()),
    }),
  });
console.log("PUT status", updateRes.status);

const responseBody = await updateRes.clone().text();
console.log("PUT response", responseBody);
  if (!updateRes.ok) {
    throw new Error("PENDING_CART_SYNC_FAILED");
  }

  clearPendingCartProduct();
  const updatedCart = await updateRes.json();
  localStorage.setItem(PENDING_CART_SYNCED_KEY, "true");
  return updatedCart;
};

export const consumePendingCartSyncedFlag = () => {
  if (typeof window === "undefined") return false;
  const wasSynced = localStorage.getItem(PENDING_CART_SYNCED_KEY) === "true";
  if (wasSynced) {
    localStorage.removeItem(PENDING_CART_SYNCED_KEY);
  }
  return wasSynced;
};

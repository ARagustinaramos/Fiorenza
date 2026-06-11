import crypto from "crypto";
import prisma from "../config/prisma.js";
import {
  confirmOrderService,
  createOrderFromSnapshot,
} from "../services/orders.service.js";
import { sendNewRetailOrderMail } from "../services/mailer.service.js";
import { buildRetailOrderShippingSnapshot } from "../utils/shipping.utils.js";

const MP_BASE_URL = "https://api.mercadopago.com";

const getAccessToken = () => {
  const token = process.env.MERCADOPAGO_ACCESS_TOKEN;
  if (!token) {
    throw new Error("MERCADOPAGO_ACCESS_TOKEN_NOT_CONFIGURED");
  }
  return token;
};

const mapPaymentStatus = (status) => {
  switch (String(status || "").toLowerCase()) {
    case "approved":
      return "PAID";
    case "refunded":
      return "REFUNDED";
    case "cancelled":
    case "rejected":
      return "FAILED";
    case "in_process":
    case "pending":
    case "authorized":
    default:
      return "PENDING";
  }
};

const ensureValidUrl = (value) => {
  if (!value) return undefined;
  const trimmed = String(value).trim();
  if (!trimmed) return undefined;
  try {
    // Throws if invalid
    new URL(trimmed);
    return trimmed;
  } catch {
    return undefined;
  }
};

const buildNotificationUrl = () => {
  const direct = ensureValidUrl(process.env.MERCADOPAGO_WEBHOOK_URL);
  if (direct) return direct;

  if (process.env.BACKEND_URL) {
    const base = String(process.env.BACKEND_URL).replace(/\/+$/, "");
    return ensureValidUrl(`${base}/api/payments/mercadopago/webhook`);
  }
  return undefined;
};

const resolveFrontendBaseUrl = (req) => {
  const envBase = ensureValidUrl(process.env.FRONTEND_URL);
  if (envBase) {
    return String(envBase).replace(/\/+$/, "");
  }

  const originHeader = ensureValidUrl(req.get("origin"));
  if (originHeader) {
    return String(originHeader).replace(/\/+$/, "");
  }

  const refererHeader = ensureValidUrl(req.get("referer"));
  if (refererHeader) {
    try {
      const refererUrl = new URL(refererHeader);
      return refererUrl.origin.replace(/\/+$/, "");
    } catch {
      return undefined;
    }
  }

  return undefined;
};

const buildReturnUrls = (req) => {
  const base = resolveFrontendBaseUrl(req);
  if (!base) return undefined;

  try {
    const parsedBase = new URL(base);
    if (["localhost", "127.0.0.1"].includes(parsedBase.hostname)) {
      return undefined;
    }
  } catch {
    return undefined;
  }

  const success = ensureValidUrl(
    `${base}/dashboard/pedidos?mp_status=success`
  );
  const failure = ensureValidUrl(`${base}/dashboard/pedidos?mp_status=failure`);
  const pending = ensureValidUrl(`${base}/dashboard/pedidos?mp_status=pending`);

  if (!success || !failure || !pending) {
    return undefined;
  }

  return { success, failure, pending };
};

const fetchMp = async (endpoint, options = {}) => {
  const token = getAccessToken();
  const res = await fetch(`${MP_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const message = data?.message || data?.error || `MP_ERROR_${res.status}`;
    throw new Error(message);
  }
  return data;
};

const getPaymentSessionId = (payment) =>
  payment?.external_reference ||
  payment?.metadata?.session_id ||
  payment?.metadata?.sessionId;

const finalizePaidSession = async ({ session, payment, user }) => {
  const mappedStatus = mapPaymentStatus(payment.status);

  await prisma.mercadoPagoSession.update({
    where: { id: session.id },
    data: {
      status: mappedStatus,
    },
  });

  if (mappedStatus !== "PAID") {
    return {
      orderId: session.orderId || null,
      paymentStatus: mappedStatus,
    };
  }

  if (session.orderId) {
    return {
      orderId: session.orderId,
      paymentStatus: "PAID",
    };
  }

  const snapshot = session.cartSnapshot || {};
  const snapshotItems = Array.isArray(snapshot.items) ? snapshot.items : [];

  const createdOrder = await createOrderFromSnapshot({
    user: user || { id: session.userId, rol: "MINORISTA" },
    type: "MINORISTA",
    items: snapshotItems,
    totalAmount: Number(snapshot.total ?? session.amount),
    shippingSnapshot: snapshot.shippingSnapshot || null,
  });

  await prisma.order.update({
    where: { id: createdOrder.id },
    data: {
      paymentMethod: "mercadopago",
      paymentRef: String(payment.id || ""),
      paymentStatus: "PAID",
    },
  });

  const confirmedOrder = await confirmOrderService(createdOrder.id);

  await prisma.mercadoPagoSession.update({
    where: { id: session.id },
    data: {
      orderId: createdOrder.id,
      status: "PAID",
    },
  });

  try {
    await sendNewRetailOrderMail(confirmedOrder);
  } catch (emailError) {
    console.error("Error al enviar email de pedido minorista:", emailError);
  }

  return {
    orderId: createdOrder.id,
    paymentStatus: "PAID",
  };
};

export const createMpPreference = async (req, res) => {
  try {
    if (String(req.user?.rol || "").toUpperCase() !== "MINORISTA") {
      return res.status(403).json({ error: "ONLY_MINORISTA_ALLOWED" });
    }

    const cart = await prisma.cart.findUnique({
      where: { userId: req.user.id },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ error: "CART_EMPTY" });
    }

    const unavailableItems = cart.items.filter((item) => {
      const product = item.product;
      const stock = Number(product?.stock || 0);

      return (
        !product ||
        !product.activo ||
        !product.web ||
        stock <= 0 ||
        item.quantity > stock
      );
    });

    if (unavailableItems.length > 0) {
      return res.status(400).json({
        error: "CART_ITEMS_UNAVAILABLE",
        message:
          "Hay productos sin stock o ya no disponibles en tu carrito. Actualizalo antes de pagar.",
      });
    }

    // Usar la misma lógica de precios que el resto de la app
    const getUnitPrice = (product) => {
      // Como es minorista, usamos precio con IVA
      const price = Number(product.precioConIva ?? product.precioMayoristaSinIva ?? 0);
      return price;
    };

    let shippingSnapshot;
    try {
      shippingSnapshot = buildRetailOrderShippingSnapshot({
        profile: req.user?.perfilMinorista,
        shipping: req.body || {},
      });
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }

    const sessionId = crypto.randomUUID();

    const snapshotItems = cart.items.map((item) => {
      const unitPrice = getUnitPrice(item.product);
      if (unitPrice <= 0) {
        throw new Error(`El producto ${item.product?.descripcion || item.productId} no tiene un precio válido.`);
      }
      const subtotal = unitPrice * item.quantity;
      return {
        productId: item.productId,
        quantity: item.quantity,
        unitPrice,
        subtotal: Number(subtotal.toFixed(2)),
      };
    });

    // Asegurar que el total sea un número con 2 decimales para que coincida con el frontend
    const snapshotTotal = Number(snapshotItems.reduce(
      (sum, item) => sum + (item.unitPrice * item.quantity),
      0
    ).toFixed(2));

    if (snapshotTotal <= 0) {
      return res.status(400).json({ error: "El total del carrito debe ser mayor a 0" });
    }

    const preferenceItems = cart.items.map((item, index) => ({
      title: item.product?.descripcion || "Producto",
      quantity: item.quantity,
      unit_price: Number(Number(snapshotItems[index]?.unitPrice ?? 0).toFixed(2)),
      currency_id: "ARS",
    }));

    const preferencePayload = {
      items: preferenceItems,
      payer: {
        email: req.user.email,
      },
      external_reference: sessionId,
      metadata: {
        session_id: sessionId,
        user_id: req.user.id,
        shipping_method: shippingSnapshot.shippingMethod,
      },
    };

    const notificationUrl = buildNotificationUrl();
    if (notificationUrl) {
      preferencePayload.notification_url = notificationUrl;
    }

    const backUrls = buildReturnUrls(req);
    if (backUrls?.success && backUrls?.failure && backUrls?.pending) {
      preferencePayload.back_urls = backUrls;
      preferencePayload.auto_return = "approved";
    }

    const preference = await fetchMp("/checkout/preferences", {
      method: "POST",
      body: JSON.stringify(preferencePayload),
    });

    console.log("MP preference created:", preference.id);

    await prisma.mercadoPagoSession.create({
      data: {
        id: sessionId,
        userId: req.user.id,
        preferenceId: preference.id,
        amount: snapshotTotal,
        status: "PENDING",
        cartSnapshot: {
          items: snapshotItems,
          total: snapshotTotal,
          shippingSnapshot,
        },
      },
    });

    res.json({
      preferenceId: preference.id,
      amount: Number(snapshotTotal),
    });
  } catch (error) {
    console.error("MP_PREFERENCE_ERROR:", error);
    res.status(500).json({ error: error.message || "MP_PREFERENCE_ERROR" });
  }
};

export const submitMpPayment = async (req, res) => {
  try {
    if (String(req.user?.rol || "").toUpperCase() !== "MINORISTA") {
      return res.status(403).json({ error: "ONLY_MINORISTA_ALLOWED" });
    }

    const { preferenceId, formData } = req.body || {};
    if (!preferenceId || !formData) {
      return res.status(400).json({ error: "PREFERENCE_AND_FORM_REQUIRED" });
    }

    const session = await prisma.mercadoPagoSession.findUnique({
      where: { preferenceId },
    });

    if (!session || session.userId !== req.user.id) {
      return res.status(404).json({ error: "SESSION_NOT_FOUND" });
    }

    const rawFormData = formData?.formData ?? formData;
    const {
      selectedPaymentMethod,
      selectedPaymentType,
      paymentMethod,
      paymentType,
      ...cleanFormData
    } = rawFormData || {};

    const resolvedPaymentMethodId =
      cleanFormData?.payment_method_id ||
      paymentMethod ||
      selectedPaymentMethod ||
      undefined;

    const resolvedPaymentTypeId =
      cleanFormData?.payment_type_id ||
      paymentType ||
      selectedPaymentType ||
      undefined;

    const paymentPayload = {
      ...cleanFormData,
      ...(resolvedPaymentMethodId
        ? { payment_method_id: resolvedPaymentMethodId }
        : {}),
      ...(resolvedPaymentTypeId ? { payment_type_id: resolvedPaymentTypeId } : {}),
      external_reference: session.id,
      transaction_amount: Number(session.amount),
      description: cleanFormData?.description || `Pedido Fiorenza ${session.id}`,
      payer: {
        ...(cleanFormData?.payer || {}),
        email: cleanFormData?.payer?.email || req.user.email,
      },
      metadata: {
        session_id: session.id,
        user_id: req.user.id,
      },
    };

    console.log(`[MP] Procesando pago sesión: ${session.id}. Monto: ${paymentPayload.transaction_amount}`);

    const payment = await fetchMp("/v1/payments", {
      method: "POST",
      headers: {
        "X-Idempotency-Key": crypto.randomUUID(),
      },
      body: JSON.stringify(paymentPayload),
    });

    const finalized = await finalizePaidSession({
      session,
      payment,
      user: req.user,
    });

    res.json({
      paymentId: payment.id,
      status: payment.status,
      statusDetail: payment.status_detail,
      paymentStatus: finalized.paymentStatus,
      orderId: finalized.orderId,
    });
  } catch (error) {
    console.error("MP_PAYMENT_ERROR:", error);
    res.status(500).json({ error: error.message || "MP_PAYMENT_ERROR" });
  }
};

export const syncMpPayment = async (req, res) => {
  try {
    if (String(req.user?.rol || "").toUpperCase() !== "MINORISTA") {
      return res.status(403).json({ error: "ONLY_MINORISTA_ALLOWED" });
    }

    const { paymentId, preferenceId } = req.body || {};

    let payment = null;
    if (paymentId) {
      payment = await fetchMp(`/v1/payments/${encodeURIComponent(paymentId)}`, {
        method: "GET",
      });
    }

    const sessionId = payment ? getPaymentSessionId(payment) : null;
    const session = sessionId
      ? await prisma.mercadoPagoSession.findUnique({ where: { id: sessionId } })
      : preferenceId
        ? await prisma.mercadoPagoSession.findUnique({ where: { preferenceId } })
        : null;

    if (!session || session.userId !== req.user.id) {
      return res.status(404).json({ error: "SESSION_NOT_FOUND" });
    }

    if (!payment) {
      return res.json({
        paymentStatus: session.status,
        orderId: session.orderId || null,
      });
    }

    const finalized = await finalizePaidSession({
      session,
      payment,
      user: req.user,
    });

    res.json({
      paymentId: payment.id,
      status: payment.status,
      statusDetail: payment.status_detail,
      paymentStatus: finalized.paymentStatus,
      orderId: finalized.orderId,
    });
  } catch (error) {
    console.error("MP_SYNC_ERROR:", error);
    res.status(500).json({ error: error.message || "MP_SYNC_ERROR" });
  }
};

export const mercadopagoWebhook = async (req, res) => {
  try {
    const paymentId =
      req.body?.data?.id ||
      req.query?.["data.id"] ||
      req.query?.id;

    if (!paymentId) {
      return res.sendStatus(200);
    }

    const payment = await fetchMp(`/v1/payments/${paymentId}`, {
      method: "GET",
    });

    const sessionId = getPaymentSessionId(payment);

    if (!sessionId) {
      return res.sendStatus(200);
    }

    const session = await prisma.mercadoPagoSession.findUnique({
      where: { id: sessionId },
    });
    if (!session) {
      return res.sendStatus(200);
    }

    await finalizePaidSession({ session, payment });

    return res.sendStatus(200);
  } catch (error) {
    console.error("MP_WEBHOOK_ERROR:", error);
    return res.sendStatus(200);
  }
};

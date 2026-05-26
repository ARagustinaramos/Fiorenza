import prisma from "../config/prisma.js";
import { validateOrderInput } from "../validators/order.validator.js";
import { isValidStatusTransition, getStatusTransitionMessage } from "../validators/orderStatus.validator.js";
import { sendNewWholesaleOrderMail } from "./mailer.service.js";
import { buildRetailOrderShippingSnapshot } from "../utils/shipping.utils.js";
import { clearProductsListCache } from "../utils/productsListCache.js";

const TX_OPTIONS = {
  maxWait: 10_000,
  timeout: 20_000,
};

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const isTransientTransactionError = (error) => {
  const message = String(error?.message || "");
  return (
    error?.code === "P2028" ||
    message.includes("Transaction not found") ||
    message.includes("Transaction already closed") ||
    message.includes("MaxClientsInSessionMode")
  );
};

const runWithTransactionRetry = async (label, operation, retries = 2) => {
  for (let attempt = 1; attempt <= retries + 1; attempt++) {
    try {
      return await operation();
    } catch (error) {
      const canRetry = isTransientTransactionError(error) && attempt <= retries;
      if (!canRetry) throw error;

      const backoffMs = attempt * 200;
      console.warn(`[${label}] Reintentando por error transitorio (${attempt}/${retries + 1}) en ${backoffMs}ms`, {
        code: error?.code,
        message: error?.message,
      });
      await wait(backoffMs);
    }
  }
};


export const createOrderService = async ({ user, type, items, shipping }) => {
  console.log("createOrderService - Input:", { type, itemsCount: items?.length, userId: user?.id, userRol: user?.rol });

  const errors = validateOrderInput({ type, items });
  if (errors.length) {
    console.error("Validation errors:", errors);
    throw new Error(errors.join(", "));
  }


  const userRol = user.rol?.toUpperCase();
  if (
    (type === "MAYORISTA" && userRol !== "MAYORISTA") ||
    (type === "MINORISTA" && userRol !== "MINORISTA")
  ) {
    console.error(`ORDER_TYPE_NOT_ALLOWED: tipo=${type}, user.rol=${user.rol}, userRol=${userRol}`);
    throw new Error(`ORDER_TYPE_NOT_ALLOWED: El usuario con rol ${user.rol} no puede crear pedidos de tipo ${type}`);
  }

  return runWithTransactionRetry("createOrderService", () =>
    prisma.$transaction(async (tx) => {
      let total = 0;
      const orderItemsData = [];

      for (const item of items) {
        console.log(`Procesando item: productId=${item.productId}, quantity=${item.quantity}`);

        const product = await tx.product.findUnique({
          where: { id: item.productId },
        });

        if (!product) {
          console.error(`Producto no encontrado: ${item.productId}`);
          throw new Error(`PRODUCT_NOT_FOUND: Producto con ID ${item.productId} no existe`);
        }

        if (!product.activo) {
          console.error(`Producto inactivo: ${item.productId}`);
          throw new Error(`PRODUCT_NOT_FOUND: Producto con ID ${item.productId} está inactivo`);
        }

        if (type === "MINORISTA" && !product.web) {
          console.error(`Producto no disponible en web: ${item.productId}`);
          throw new Error(`PRODUCT_NOT_AVAILABLE: Producto con ID ${item.productId} no estÃ¡ disponible para minorista`);
        }

        if (type === "MINORISTA" && product.stock < item.quantity) {
          console.error(`Stock insuficiente: producto=${item.productId}, stock=${product.stock}, cantidad=${item.quantity}`);
          throw new Error(`INSUFFICIENT_STOCK: Stock insuficiente para producto ${item.productId}`);
        }

        const unitPrice =
          type === "MAYORISTA"
            ? product.precioMayoristaSinIva
            : product.precioConIva;

        if (unitPrice == null) {
          console.error(`Precio no definido: producto=${item.productId}, type=${type}, precioMayoristaSinIva=${product.precioMayoristaSinIva}, precioConIva=${product.precioConIva}`);
          throw new Error(`PRICE_NOT_DEFINED: Precio no definido para producto ${item.productId} con tipo ${type}`);
        }

        const subtotal = unitPrice * item.quantity;
        total += subtotal;

        orderItemsData.push({
          productId: product.id,
          quantity: item.quantity,
          unitPrice,
          subtotal,
        });
      }

      const retailShippingSnapshot =
        type === "MINORISTA"
          ? buildRetailOrderShippingSnapshot({
            profile: user?.perfilMinorista,
            shipping,
          })
          : null;

      const order = await tx.order.create({
        data: {
          userId: user.id,
          type,
          totalAmount: total,
          status: "PENDING",
          ...(retailShippingSnapshot || {}),
          items: {
            create: orderItemsData,
          },
        },
        include: {
          items: {
            include: {
              product: true,
            },
          },
          user: {
            select: {
              email: true,
              rol: true,
              perfil: true,
              perfilMinorista: true,
            },
          },
        },
      });

      const cart = await tx.cart.findUnique({
        where: { userId: user.id },
        select: { id: true },
      });

      if (cart) {
        await tx.cartItem.deleteMany({
          where: { cartId: cart.id },
        });
      }

      return order;
    }, TX_OPTIONS)
  );
};


export const getUserOrdersService = (userId) => {
  return prisma.order.findMany({
    where: { userId },
    include: {
      items: {
        include: {
          product: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
};

export const getAllOrdersService = async ({
  status,
  type,
  paymentStatus,
  startDate,
  endDate,
  summary = false,
  page = 1,
  limit = 20,
}) => {
  const createdAt = {};

  if (startDate) {
    const parsedStartDate = new Date(startDate);
    if (!Number.isNaN(parsedStartDate.getTime())) {
      createdAt.gte = parsedStartDate;
    }
  }

  if (endDate) {
    const parsedEndDate = new Date(endDate);
    if (!Number.isNaN(parsedEndDate.getTime())) {
      createdAt.lte = parsedEndDate;
    }
  }

  const where = {
    ...(status && { status }),
    ...(type && { type }),
    ...(paymentStatus && { paymentStatus }),
    ...(Object.keys(createdAt).length > 0 && { createdAt }),
  };

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
      include: {
        user: {
          select: {
            email: true,
            rol: true,
            perfil: true,
            perfilMinorista: true,
          },
        },
        ...(!summary && {
          items: {
            include: {
              product: {
                select: {
                  descripcion: true,
                  codigoInterno: true,
                  stock: true,
                },
              },
            },
          },
        }),
      },
    }),
    prisma.order.count({ where }),
  ]);

  return {
    data: orders,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      pages: Math.ceil(total / limit),
    },
  };
};


export const confirmOrderService = async (orderId) => {
  const confirmedOrder = await runWithTransactionRetry("confirmOrderService", () =>
    prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id: orderId },
        include: {
          items: true,
          user: {
            include: {
              perfil: true,
              perfilMinorista: true,
            },
          },
        },
      });

      if (!order) throw new Error("ORDER_NOT_FOUND");
      if (order.status !== "PENDING") throw new Error("ORDER_NOT_PENDING");

      if (String(order.type || "").toUpperCase() === "MINORISTA") {
        const productIds = [...new Set(order.items.map((item) => item.productId))];
        const products = await tx.product.findMany({
          where: { id: { in: productIds } },
          select: { id: true, stock: true },
        });
        const productById = new Map(products.map((product) => [product.id, product]));

        for (const item of order.items) {
          const product = productById.get(item.productId);
          if (!product) throw new Error("PRODUCT_NOT_FOUND");

          if (product.stock < item.quantity) {
            throw new Error("INSUFFICIENT_STOCK");
          }
        }

        for (const item of order.items) {
          await tx.product.update({
            where: { id: item.productId },
            data: {
              stock: {
                decrement: item.quantity,
              },
            },
          });
        }
      }

      return tx.order.update({
        where: { id: orderId },
        data: { status: "CONFIRMED" },
        include: {
          items: {
            include: {
              product: true,
            },
          },
          user: {
            select: {
              email: true,
              rol: true,
              perfil: true,
              perfilMinorista: true,
            },
          },
        },
      });
    }, TX_OPTIONS)
  );

  clearProductsListCache();
  return confirmedOrder;
};

export const cancelOrderService = async (orderId) => {
  const cancelledOrder = await prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });

    if (!order) throw new Error("ORDER_NOT_FOUND");
    if (order.status === "CANCELLED") {
      throw new Error("ORDER_ALREADY_CANCELLED");
    }

    if (order.status === "CONFIRMED" && String(order.type || "").toUpperCase() === "MINORISTA") {
      for (const item of order.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: {
              increment: item.quantity,
            },
          },
        });
      }
    }

    return tx.order.update({
      where: { id: orderId },
      data: { status: "CANCELLED" },
    });
  });

  clearProductsListCache();
  return cancelledOrder;
};


export const updateOrderStatusService = async ({ orderId, newStatus }) => {
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: orderId },
    });

    if (!order) throw new Error("ORDER_NOT_FOUND");

    // Normalizar estados
    const normalizedNewStatus = newStatus?.toUpperCase().trim();

    console.log(`[UPDATE STATUS] Intentando transición: ${order.status} -> ${normalizedNewStatus}`);
    console.log(`[UPDATE STATUS] Estado actual en BD: "${order.status}" (tipo: ${typeof order.status})`);
    console.log(`[UPDATE STATUS] Nuevo estado solicitado: "${normalizedNewStatus}" (tipo: ${typeof normalizedNewStatus})`);

    if (!isValidStatusTransition(order.status, normalizedNewStatus)) {
      const errorMessage = getStatusTransitionMessage(order.status, normalizedNewStatus);
      throw new Error(errorMessage);
    }

    return tx.order.update({
      where: { id: orderId },
      data: { status: normalizedNewStatus },
      include: {
        user: {
          select: {
            email: true,
            rol: true,
            perfil: true,
            perfilMinorista: true,
          },
        },
        items: {
          include: {
            product: true,
          },
        },
      },
    });
  });
};

export const updateOrderAdminShippingService = async ({
  orderId,
  adminTrackingNumber,
  adminShippingCarrier,
  adminShippingNotes,
}) => {
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new Error("ORDER_NOT_FOUND");
    }

    const normalizedTrackingNumber = adminTrackingNumber?.trim() || null;
    const normalizedShippingCarrier = adminShippingCarrier?.trim() || null;
    const normalizedShippingNotes = adminShippingNotes?.trim() || null;
    const shouldMarkAsDespatched =
      String(order.type || "").toUpperCase() === "MINORISTA" &&
      order.status === "CONFIRMED" &&
      (normalizedTrackingNumber || normalizedShippingCarrier || normalizedShippingNotes);

    return tx.order.update({
      where: { id: orderId },
      data: {
        adminTrackingNumber: normalizedTrackingNumber,
        adminShippingCarrier: normalizedShippingCarrier,
        adminShippingNotes: normalizedShippingNotes,
        ...(shouldMarkAsDespatched ? { status: "DESPACHADO" } : {}),
      },
      include: {
        user: {
          select: {
            email: true,
            rol: true,
            perfil: true,
            perfilMinorista: true,
          },
        },
        items: {
          include: {
            product: true,
          },
        },
      },
    });
  });
};

export const getOrderByIdService = async (id) => {
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          email: true,
          rol: true,
          perfil: true,
          perfilMinorista: true,
        },
      },
      items: {
        include: {
          product: true,
        },
      },
    },
  });

  if (!order) {
    throw new Error("ORDER_NOT_FOUND");
  }

  return order;
};

export const previewOrderService = async ({ user, type, items }) => {
  const errors = validateOrderInput({ type, items });
  if (errors.length) {
    throw new Error(errors.join(", "));
  }

  let total = 0;
  const orderItems = [];

  for (const item of items) {
    const product = await prisma.product.findUnique({
      where: { id: item.productId },
    });

    if (!product || !product.activo) {
      throw new Error("PRODUCT_NOT_FOUND");
    }

    if (type === "MINORISTA" && !product.web) {
      throw new Error("PRODUCT_NOT_AVAILABLE");
    }

    if (type === "MINORISTA" && product.stock < item.quantity) {
      throw new Error("INSUFFICIENT_STOCK");
    }

    const unitPrice =
      type === "MAYORISTA"
        ? product.precioMayoristaSinIva
        : product.precioConIva;

    if (unitPrice == null) {
      throw new Error("PRICE_NOT_DEFINED");
    }

    const subtotal = unitPrice * item.quantity;
    total += subtotal;

    orderItems.push({
      product,
      quantity: item.quantity,
      unitPrice,
      subtotal,
    });
  }

  return {
    user,
    type,
    items: orderItems,
    totalAmount: total,
  };
};

export const createWholesaleOrderFlow = async ({ user, items }) => {
  const order = await createOrderService({
    user,
    type: "MAYORISTA",
    items,
  });

  try {
    await sendNewWholesaleOrderMail(order);
  } catch (emailError) {
    console.error("Error al enviar email de pedido mayorista:", emailError);
  }

  return order;
};

export const createOrderFromSnapshot = async ({
  user,
  type,
  items,
  totalAmount,
  shippingSnapshot,
}) => {
  if (!user) throw new Error("USER_REQUIRED");
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error("ITEMS_REQUIRED");
  }

  const userRol = user.rol?.toUpperCase();
  if (
    (type === "MAYORISTA" && userRol !== "MAYORISTA") ||
    (type === "MINORISTA" && userRol !== "MINORISTA")
  ) {
    throw new Error(`ORDER_TYPE_NOT_ALLOWED: El usuario con rol ${user.rol} no puede crear pedidos de tipo ${type}`);
  }

  return runWithTransactionRetry("createOrderFromSnapshot", () =>
    prisma.$transaction(async (tx) => {
      let total = 0;
      const orderItemsData = [];

      for (const item of items) {
        const product = await tx.product.findUnique({
          where: { id: item.productId },
        });

        if (!product) {
          throw new Error(`PRODUCT_NOT_FOUND: Producto con ID ${item.productId} no existe`);
        }

        if (!product.activo) {
          throw new Error(`PRODUCT_NOT_FOUND: Producto con ID ${item.productId} está inactivo`);
        }

        if (type === "MINORISTA" && !product.web) {
          throw new Error(`PRODUCT_NOT_AVAILABLE: Producto con ID ${item.productId} no está disponible para minorista`);
        }

        if (type === "MINORISTA" && product.stock < item.quantity) {
          throw new Error(`INSUFFICIENT_STOCK: Stock insuficiente para producto ${item.productId}`);
        }

        const unitPrice = Number(item.unitPrice ?? 0);
        if (!unitPrice) {
          throw new Error(`PRICE_NOT_DEFINED: Precio no definido para producto ${item.productId}`);
        }

        const subtotal = Number(item.subtotal ?? unitPrice * item.quantity);
        total += subtotal;

        orderItemsData.push({
          productId: product.id,
          quantity: item.quantity,
          unitPrice,
          subtotal,
        });
      }

      const totalToUse =
        typeof totalAmount === "number"
          ? totalAmount
          : typeof totalAmount === "string"
            ? Number(totalAmount)
            : total;

      const order = await tx.order.create({
        data: {
          userId: user.id,
          type,
          totalAmount: totalToUse,
          status: "PENDING",
          ...(shippingSnapshot || {}),
          items: {
            create: orderItemsData,
          },
        },
        include: {
          items: {
            include: {
              product: true,
            },
          },
          user: {
            select: {
              email: true,
              rol: true,
              perfil: true,
              perfilMinorista: true,
            },
          },
        },
      });

      const cart = await tx.cart.findUnique({
        where: { userId: user.id },
        select: { id: true },
      });

      if (cart) {
        await tx.cartItem.deleteMany({
          where: { cartId: cart.id },
        });
      }

      return order;
    }, TX_OPTIONS)
  );
};

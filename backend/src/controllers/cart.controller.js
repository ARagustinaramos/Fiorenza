import prisma from "../config/prisma.js";

const getUnitPrice = (product, userRole) => {
  const role = String(userRole || "").toUpperCase();
  if (role === "MAYORISTA") {
    return Number(product.precioMayoristaSinIva ?? product.precioConIva ?? 0);
  }
  return Number(product.precioConIva ?? product.precioMayoristaSinIva ?? 0);
};

const normalizeCartItemsByAvailability = (items, userRole) => {
  const role = String(userRole || "").toUpperCase();

  return items.reduce(
    (acc, item) => {
      const product = item.product;
      const stock = Number(product?.stock || 0);

      const isAvailable =
        product &&
        product.activo &&
        stock > 0 &&
        (role !== "MINORISTA" || product.web);

      if (!isAvailable) {
        acc.removedIds.push(item.id);
        return acc;
      }

      const normalizedQuantity = Math.max(1, Math.min(Math.floor(item.quantity), stock));
      acc.items.push({
        ...item,
        quantity: normalizedQuantity,
      });

      if (normalizedQuantity !== item.quantity) {
        acc.updatedItems.push({
          id: item.id,
          quantity: normalizedQuantity,
        });
      }

      return acc;
    },
    { items: [], removedIds: [], updatedItems: [] }
  );
};

const mapCartItems = (items, userRole) =>
  items.map((item) => ({
    id: item.product.id,
    nombre: item.product.descripcion,
    codigo: item.product.codigoInterno || item.product.codigoOriginal || "-",
    precioUnitario: getUnitPrice(item.product, userRole),
    cantidad: item.quantity,
    producto: item.product,
  }));

export const getMyCart = async (req, res) => {
  try {
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

    if (!cart) {
      return res.json({ items: [] });
    }

    const normalizedCart = normalizeCartItemsByAvailability(
      cart.items,
      req.user?.rol
    );

    if (normalizedCart.removedIds.length || normalizedCart.updatedItems.length) {
      await prisma.$transaction(async (tx) => {
        if (normalizedCart.removedIds.length) {
          await tx.cartItem.deleteMany({
            where: { id: { in: normalizedCart.removedIds } },
          });
        }

        for (const item of normalizedCart.updatedItems) {
          await tx.cartItem.update({
            where: { id: item.id },
            data: { quantity: item.quantity },
          });
        }
      });
    }

    return res.json({ items: mapCartItems(normalizedCart.items, req.user?.rol) });
  } catch (error) {
    return res.status(500).json({ error: "ERROR_GETTING_CART" });
  }
};

export const replaceMyCart = async (req, res) => {
  try {
    const rawItems = Array.isArray(req.body?.items) ? req.body.items : [];
    const normalized = rawItems
      .map((item) => ({
        productId: String(item.productId || "").trim(),
        quantity: Number(item.quantity),
      }))
      .filter((item) => item.productId && Number.isFinite(item.quantity) && item.quantity > 0);

    const productIds = [...new Set(normalized.map((item) => item.productId))];

    const role = String(req.user?.rol || "").toUpperCase();
    let sanitizedItems = normalized.map((item) => ({
      ...item,
      quantity: Math.floor(item.quantity),
    }));

    if (productIds.length > 0) {
      const existingProducts = await prisma.product.findMany({
        where: {
          id: { in: productIds },
          activo: true,
        },
        select: {
          id: true,
          stock: true,
          web: true,
        },
      });

      const productsById = new Map(
        existingProducts.map((product) => [product.id, product])
      );

      sanitizedItems = sanitizedItems.reduce((acc, item) => {
        const product = productsById.get(item.productId);
        const stock = Number(product?.stock || 0);

        if (!product || stock <= 0) {
          return acc;
        }

        if (role === "MINORISTA" && !product.web) {
          return acc;
        }

        const quantity = Math.max(1, Math.min(item.quantity, stock));
        acc.push({
          productId: item.productId,
          quantity,
        });
        return acc;
      }, []);
    }

    await prisma.$transaction(async (tx) => {
      const cart = await tx.cart.upsert({
        where: { userId: req.user.id },
        update: {},
        create: { userId: req.user.id },
      });

      await tx.cartItem.deleteMany({
        where: { cartId: cart.id },
      });

      if (sanitizedItems.length > 0) {
        await tx.cartItem.createMany({
          data: sanitizedItems.map((item) => ({
            cartId: cart.id,
            productId: item.productId,
            quantity: item.quantity,
          })),
        });
      }
    });

    const updatedCart = await prisma.cart.findUnique({
      where: { userId: req.user.id },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    const normalizedCart = updatedCart
      ? normalizeCartItemsByAvailability(updatedCart.items, req.user?.rol)
      : { items: [] };

    return res.json({
      items: normalizedCart.items
        ? mapCartItems(normalizedCart.items, req.user?.rol)
        : [],
    });
  } catch (error) {
    return res.status(500).json({ error: "ERROR_UPDATING_CART" });
  }
};

export const clearMyCart = async (req, res) => {
  try {
    const cart = await prisma.cart.findUnique({
      where: { userId: req.user.id },
      select: { id: true },
    });

    if (cart) {
      await prisma.cartItem.deleteMany({
        where: { cartId: cart.id },
      });
    }

    return res.json({ items: [] });
  } catch (error) {
    return res.status(500).json({ error: "ERROR_CLEARING_CART" });
  }
};

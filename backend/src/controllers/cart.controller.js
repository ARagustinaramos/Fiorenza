import prisma from "../config/prisma.js";

const mapCartItems = (items) =>
  items.map((item) => ({
    id: item.product.id,
    nombre: item.product.descripcion,
    codigo: item.product.codigoInterno || item.product.codigoOriginal || "-",
    precioUnitario: Number(item.product.precioConIva || 0),
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

    return res.json({ items: mapCartItems(cart.items) });
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

    if (productIds.length > 0) {
      const existingProducts = await prisma.product.findMany({
        where: {
          id: { in: productIds },
          activo: true,
        },
        select: { id: true },
      });

      const validIds = new Set(existingProducts.map((product) => product.id));
      if (validIds.size !== productIds.length) {
        return res.status(400).json({ error: "INVALID_PRODUCT_IN_CART" });
      }
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

      if (normalized.length > 0) {
        await tx.cartItem.createMany({
          data: normalized.map((item) => ({
            cartId: cart.id,
            productId: item.productId,
            quantity: Math.floor(item.quantity),
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

    return res.json({
      items: updatedCart ? mapCartItems(updatedCart.items) : [],
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

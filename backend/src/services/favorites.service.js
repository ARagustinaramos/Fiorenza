import prisma from "../config/prisma.js";

const isMinoristaRole = (role) => String(role || "").toUpperCase() === "MINORISTA";

export const getFavoritesService = async (userId, userRole) => {
  try {
    const favorites = await prisma.favorite.findMany({
      where: {
        userId,
      },
      include: {
        product: {
          include: {
            images: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return favorites
      .map((fav) => fav.product)
      .filter(
        (product) =>
          product &&
          product.activo &&
          (!isMinoristaRole(userRole) || (product.web && Number(product.stock || 0) > 0))
      );
  } catch (error) {
    console.error("Error en getFavoritesService:", error);
    throw new Error("Error al obtener favoritos");
  }
};

export const addFavoriteService = async (userId, productId, userRole) => {
  try {
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new Error("Producto no encontrado");
    }

    if (!product.activo) {
      throw new Error("El producto no esta disponible");
    }

    if (isMinoristaRole(userRole) && (!product.web || Number(product.stock || 0) <= 0)) {
      throw new Error("El producto no esta disponible");
    }

    const existingFavorite = await prisma.favorite.findUnique({
      where: {
        userId_productId: {
          userId,
          productId,
        },
      },
    });

    if (existingFavorite) {
      return existingFavorite;
    }

    const favorite = await prisma.favorite.create({
      data: {
        userId,
        productId,
      },
      include: {
        product: true,
      },
    });

    return favorite.product;
  } catch (error) {
    console.error("Error en addFavoriteService:", error);
    throw error;
  }
};

export const removeFavoriteService = async (userId, productId) => {
  try {
    const favorite = await prisma.favorite.findUnique({
      where: {
        userId_productId: {
          userId,
          productId,
        },
      },
    });

    if (!favorite) {
      throw new Error("Favorito no encontrado");
    }

    await prisma.favorite.delete({
      where: {
        userId_productId: {
          userId,
          productId,
        },
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Error en removeFavoriteService:", error);
    throw error;
  }
};

export const toggleFavoriteService = async (userId, productId, userRole) => {
  try {
    const existingFavorite = await prisma.favorite.findUnique({
      where: {
        userId_productId: {
          userId,
          productId,
        },
      },
    });

    if (existingFavorite) {
      await removeFavoriteService(userId, productId);
      return { isFavorite: false };
    }

    await addFavoriteService(userId, productId, userRole);
    return { isFavorite: true };
  } catch (error) {
    console.error("Error en toggleFavoriteService:", error);
    throw error;
  }
};

export const checkFavoriteService = async (userId, productId) => {
  try {
    const favorite = await prisma.favorite.findUnique({
      where: {
        userId_productId: {
          userId,
          productId,
        },
      },
    });

    return !!favorite;
  } catch (error) {
    console.error("Error en checkFavoriteService:", error);
    return false;
  }
};

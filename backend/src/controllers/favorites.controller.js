import {
  getFavoritesService,
  addFavoriteService,
  removeFavoriteService,
  toggleFavoriteService,
  checkFavoriteService,
} from "../services/favorites.service.js";

export const getFavorites = async (req, res) => {
  try {
    const userId = req.user.id;
    const products = await getFavoritesService(userId);

    res.json(products);
  } catch (error) {
    console.error("Error en getFavorites:", error);
    res.status(500).json({
      error: error.message || "Error al obtener favoritos",
    });
  }
};

export const addFavorite = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId } = req.body;

    if (!productId) {
      return res.status(400).json({ error: "productId es requerido" });
    }

    const product = await addFavoriteService(userId, productId);

    res.status(201).json(product);
  } catch (error) {
    console.error("Error en addFavorite:", error);
    res.status(400).json({
      error: error.message || "Error al agregar favorito",
    });
  }
};

export const removeFavorite = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId } = req.params;

    if (!productId) {
      return res.status(400).json({ error: "productId es requerido" });
    }

    await removeFavoriteService(userId, productId);

    res.json({ success: true, message: "Favorito eliminado" });
  } catch (error) {
    console.error("Error en removeFavorite:", error);
    res.status(400).json({
      error: error.message || "Error al eliminar favorito",
    });
  }
};

export const toggleFavorite = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId } = req.body;

    if (!productId) {
      return res.status(400).json({ error: "productId es requerido" });
    }

    const result = await toggleFavoriteService(userId, productId);

    res.json(result);
  } catch (error) {
    console.error("Error en toggleFavorite:", error);
    res.status(400).json({
      error: error.message || "Error al cambiar estado del favorito",
    });
  }
};

export const checkFavorite = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId } = req.params;

    if (!productId) {
      return res.status(400).json({ error: "productId es requerido" });
    }

    const isFavorite = await checkFavoriteService(userId, productId);

    res.json({ isFavorite });
  } catch (error) {
    console.error("Error en checkFavorite:", error);
    res.status(500).json({
      error: error.message || "Error al verificar favorito",
    });
  }
};

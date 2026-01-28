import express from "express";
import { auth } from "../middlewares/auth.middleware.js";
import {
  getFavorites,
  addFavorite,
  removeFavorite,
  toggleFavorite,
  checkFavorite,
} from "../controllers/favorites.controller.js";

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(auth);

// Obtener todos los favoritos del usuario
router.get("/", getFavorites);

// Agregar un favorito
router.post("/", addFavorite);

// Eliminar un favorito
router.delete("/:productId", removeFavorite);

// Toggle favorito (agregar/eliminar)
router.post("/toggle", toggleFavorite);

// Verificar si un producto es favorito
router.get("/check/:productId", checkFavorite);

export default router;

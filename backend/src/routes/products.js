import express from "express";
import upload from "../middlewares/upload.js";
import { bulkUpload } from "../controllers/productBulk.controller.js";
import { bulkImagesUpload } from "../controllers/productImages.controller.js";
import { auth } from "../middlewares/auth.middleware.js";
import { requireRole } from "../middlewares/role.middleware.js";
import { optionalAuth } from "../middlewares/optionalAuth.middleware.js";
import {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  getOfferProducts,
  getNewProducts,
  getFeaturedProducts,
  updateProductFlags,
  getMarcasFiltro,
  getRubrosFiltro,
} from "../controllers/product/products.controller.js";

const router = express.Router();

router.post(
  "/bulk-upload",
  auth,
  requireRole("ADMIN"),
  upload.single("file"),
  bulkUpload
);

router.post(
  "/bulk-images",
  auth,
  requireRole("ADMIN"),
  upload.array("images", 50),
  bulkImagesUpload
);


router.get("/offers", getOfferProducts);
router.get("/new", getNewProducts);
router.get("/featured", getFeaturedProducts);

router.get("/", getProducts);
router.get("/:id", optionalAuth, getProductById);

router.post("/", auth, requireRole("ADMIN"), createProduct);
router.put("/:id", auth, requireRole("ADMIN"), updateProduct);
router.delete("/:id", auth, requireRole("ADMIN"), deleteProduct);

router.get("/filters/marcas", getMarcasFiltro);
router.get("/filters/rubros", getRubrosFiltro);
router.patch(
  "/:id/flags",
  auth,
  requireRole("ADMIN"),
  updateProductFlags
);

export default router;
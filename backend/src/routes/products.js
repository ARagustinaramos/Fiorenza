import express from "express";
import rateLimit from "express-rate-limit";
import upload from "../middlewares/upload.js";
import bulkUploadFile from "../middlewares/bulkUpload.js";
import { bulkUpload, bulkUploadStatus } from "../controllers/productBulk.controller.js";
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

const bulkLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: Number(process.env.BULK_RATE_LIMIT_MAX || 10),
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Demasiadas cargas en poco tiempo, por favor intenta mÃ¡s tarde." },
});

router.post(
  "/bulk-upload",
  bulkLimiter,
  auth,
  requireRole("ADMIN"),
  bulkUploadFile.single("file"),
  bulkUpload
);

router.get(
  "/bulk-upload/status/:id",
  bulkUploadStatus
);

router.post(
  "/bulk-images",
  bulkLimiter,
  auth,
  requireRole("ADMIN"),
  upload.fields([
    { name: "images", maxCount: Number(process.env.BULK_IMAGES_MAX_FILES || 200) },
    { name: "archive", maxCount: 1 },
  ]),
  bulkImagesUpload
);


router.get("/offers", getOfferProducts);
router.get("/new", getNewProducts);
router.get("/featured", getFeaturedProducts);

router.get("/", optionalAuth, getProducts);
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

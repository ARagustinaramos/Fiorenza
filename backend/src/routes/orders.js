import express from "express";
import { auth } from "../middlewares/auth.middleware.js";
import { requireRole } from "../middlewares/role.middleware.js";

import {
  createOrder,
  getMyOrders,
  getOrderById,
  getAllOrders,
  updateOrderStatus,
  confirmOrder,
  cancelOrder,
} from "../controllers/orders.controller.js";

const router = express.Router();

//USER 

router.post("/", auth, createOrder);
router.get("/me", auth, getMyOrders);
router.get("/:id", auth, getOrderById);

// ADMIN 

router.get("/", auth, requireRole("ADMIN"), getAllOrders);
router.patch(
  "/:id/status",
  auth,
  requireRole("ADMIN"),
  updateOrderStatus
);

router.post(
  "/:id/confirm",
  auth,
  requireRole("ADMIN"),
  confirmOrder
);

router.patch(
  "/:id/cancel",
  auth,
  requireRole("ADMIN"),
  cancelOrder
);

export default router;


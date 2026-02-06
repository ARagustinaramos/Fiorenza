import express from "express";
import { auth } from "../middlewares/auth.middleware.js";
import { requireRole } from "../middlewares/role.middleware.js";

const router = express.Router();

router.get(
  "/admin-only",
  auth,
  requireRole("ADMIN"),
  (req, res) => {
    res.json({
      message: "Bienvenido Admin 👑",
      user: req.user.email,
    });
  }
);

export default router;

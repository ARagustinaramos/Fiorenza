import express from "express";
import rateLimit from "express-rate-limit";
import { register, login, forgotPassword, resetPassword } from "../controllers/auth.controller.js";
import { auth } from "../middlewares/auth.middleware.js";

const router = express.Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: Number(process.env.AUTH_RATE_LIMIT_MAX || 20),
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Demasiados intentos, por favor intenta mÃ¡s tarde." },
});

router.post("/register", authLimiter, register);
router.post("/login", authLimiter, login);

router.get("/me", auth, (req, res) => {
    res.json({
      id: req.user.id,
      email: req.user.email,
      rol: req.user.rol,
    });
  });

router.post("/forgot-password", authLimiter, forgotPassword);
router.post("/reset-password", authLimiter, resetPassword);


export default router;


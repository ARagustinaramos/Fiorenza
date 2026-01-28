import express from "express";
import { register, login, forgotPassword, resetPassword } from "../controllers/auth.controller.js";
import { auth } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);

router.get("/me", auth, (req, res) => {
    res.json({
      id: req.user.id,
      email: req.user.email,
      rol: req.user.rol,
    });
  });

router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);


export default router;


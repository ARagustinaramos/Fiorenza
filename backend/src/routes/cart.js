import express from "express";
import { auth } from "../middlewares/auth.middleware.js";
import { clearMyCart, getMyCart, replaceMyCart } from "../controllers/cart.controller.js";

const router = express.Router();

router.get("/", auth, getMyCart);
router.put("/", auth, replaceMyCart);
router.delete("/", auth, clearMyCart);

export default router;

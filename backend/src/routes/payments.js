import { Router } from "express";
import { auth } from "../middlewares/auth.middleware.js";
import {
  createMpPreference,
  submitMpPayment,
  mercadopagoWebhook,
} from "../controllers/mercadopago.controller.js";

const router = Router();

router.post("/mercadopago/preference", auth, createMpPreference);
router.post("/mercadopago/submit", auth, submitMpPayment);
router.post("/mercadopago/webhook", mercadopagoWebhook);

export default router;

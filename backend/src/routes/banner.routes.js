import express from "express";
import multer from "multer";
import {
  createBanner,
  getActiveBanners,
} from "../controllers/banner.controller.js";

const router = express.Router();
const upload = multer();

router.get("/", getActiveBanners);
router.post("/", upload.single("image"), createBanner);

export default router;

import { Router } from "express";
import upload from "../middlewares/downloadsUpload.js";
import { auth } from "../middlewares/auth.middleware.js";
import { requireRole } from "../middlewares/role.middleware.js";

import {
  uploadDownload,
  getDownloads,
  deleteDownload,
  downloadFile,
} from "../controllers/downloads.controller.js";

const router = Router();

router.post("/", auth, requireRole("ADMIN"), upload.single("file"), uploadDownload);
router.get("/", getDownloads);
router.delete("/:id", auth, requireRole("ADMIN"), deleteDownload);
router.get("/:id/file", downloadFile);


export default router;

import { Router } from "express";
import upload from "../middlewares/upload.js";

import {
  uploadDownload,
  getDownloads,
  deleteDownload,
  downloadFile,
} from "../controllers/downloads.controller.js";

const router = Router();

router.post("/", upload.single("file"), uploadDownload);
router.get("/", getDownloads);
router.delete("/:id", deleteDownload);
router.get("/:id/file", downloadFile);


export default router;

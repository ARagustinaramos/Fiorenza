import multer from "multer";
import path from "path";
import fs from "fs";
import crypto from "crypto";

const maxFileSizeMb = Number(process.env.DOWNLOAD_MAX_MB || process.env.UPLOAD_MAX_MB || 100);
const maxFileSize = maxFileSizeMb * 1024 * 1024;
const uploadsDir = path.join(process.cwd(), "uploads", "downloads");

fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || "");
    const safeName = `${Date.now()}-${crypto.randomUUID()}${ext}`;
    cb(null, safeName);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: maxFileSize },
});

export default upload;

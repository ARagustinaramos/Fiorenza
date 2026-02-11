import fs from "fs";
import path from "path";
import multer from "multer";

const maxFileSizeMb = Number(process.env.UPLOAD_MAX_MB || 50);
const maxFileSize = maxFileSizeMb * 1024 * 1024;

const uploadDir = path.join(process.cwd(), "uploads", "bulk");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const safeName = file.originalname.replace(/\s+/g, "_");
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}-${safeName}`);
  },
});

const bulkUpload = multer({
  storage,
  limits: { fileSize: maxFileSize },
});

export default bulkUpload;

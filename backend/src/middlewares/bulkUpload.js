import fs from "fs";
import os from "os";
import path from "path";
import multer from "multer";

const maxFileSizeMb = Number(process.env.UPLOAD_MAX_MB || 50);
const maxFileSize = maxFileSizeMb * 1024 * 1024;

const ensureWritableDir = (dirPath) => {
  try {
    fs.mkdirSync(dirPath, { recursive: true });
    fs.accessSync(dirPath, fs.constants.W_OK);
    return true;
  } catch {
    return false;
  }
};

const resolveUploadDir = () => {
  const candidates = [
    process.env.BULK_UPLOAD_DIR,
    path.join(process.cwd(), "uploads", "bulk"),
    path.join(os.tmpdir(), "fiorenza", "bulk"),
  ].filter(Boolean);

  for (const candidate of candidates) {
    if (ensureWritableDir(candidate)) {
      return candidate;
    }
  }

  throw new Error(
    "No se encontro un directorio escribible para bulk upload. Configura BULK_UPLOAD_DIR."
  );
};

const uploadDir = resolveUploadDir();

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

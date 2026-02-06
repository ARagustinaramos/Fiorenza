import multer from "multer";

const maxFileSizeMb = Number(process.env.UPLOAD_MAX_MB || 50);
const maxFileSize = maxFileSizeMb * 1024 * 1024;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: maxFileSize },
});

export default upload;


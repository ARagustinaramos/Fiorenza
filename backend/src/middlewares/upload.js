import multer from "multer";
import path from "path";

const maxFileSizeMb = Number(process.env.UPLOAD_MAX_MB || 50);
const maxFileSize = maxFileSizeMb * 1024 * 1024;

const imageMimeRegex = /^image\//i;
const zipMimeTypes = new Set([
  "application/zip",
  "application/x-zip-compressed",
  "multipart/x-zip",
  "application/octet-stream",
]);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: maxFileSize },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname || "").toLowerCase();

    if (file.fieldname === "images") {
      if (imageMimeRegex.test(file.mimetype)) {
        return cb(null, true);
      }
      return cb(new Error("INVALID_IMAGE_FILE"));
    }

    if (file.fieldname === "archive") {
      if (ext === ".rar") {
        return cb(new Error("RAR_NOT_SUPPORTED_USE_ZIP"));
      }
      if (ext === ".zip" && (zipMimeTypes.has(file.mimetype) || file.mimetype === "")) {
        return cb(null, true);
      }
      return cb(new Error("INVALID_ARCHIVE_FORMAT_USE_ZIP"));
    }

    return cb(new Error("INVALID_UPLOAD_FIELD"));
  },
});

export default upload;


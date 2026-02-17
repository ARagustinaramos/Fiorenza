import path from "path";
import { Readable } from "stream";
import unzipper from "unzipper";
import prisma from "../config/prisma.js";
import cloudinary from "../config/cloudinary.js";

const allowedImageExt = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif"]);
const maxFiles = Number(process.env.BULK_IMAGES_MAX_FILES || 200);

const uploadToCloudinary = (buffer, publicId) =>
  new Promise((resolve, reject) => {
    const upload = cloudinary.uploader.upload_stream(
      {
        folder: "products",
        public_id: publicId,
        overwrite: true,
        resource_type: "image",
      },
      (error, result) => {
        if (error) return reject(error);
        return resolve(result);
      }
    );

    Readable.from(buffer).pipe(upload);
  });

function parseProductFileInfo(fileName) {
  if (!fileName) return null;

  const baseName = path.basename(fileName).trim();
  const ext = path.extname(baseName).toLowerCase();
  if (!allowedImageExt.has(ext)) return null;

  const nameWithoutExt = baseName.slice(0, -ext.length).trim();
  if (!nameWithoutExt) return null;

  const match = nameWithoutExt.match(/^(.*)-(\d+)$/);
  if (match) {
    return {
      productCode: match[1].trim(),
      order: Number(match[2]),
    };
  }

  return {
    productCode: nameWithoutExt,
    order: 0,
  };
}

async function buildFilesFromZip(zipBuffer) {
  const directory = await unzipper.Open.buffer(zipBuffer);
  const files = [];

  for (const entry of directory.files) {
    if (entry.type !== "File") continue;

    const parsed = parseProductFileInfo(entry.path);
    if (!parsed) continue;

    const buffer = await entry.buffer();
    files.push({
      originalname: path.basename(entry.path),
      buffer,
      parsed,
    });
  }

  return files;
}

export const bulkImagesUpload = async (req, res) => {
  try {
    const imageFiles = Array.isArray(req.files?.images) ? req.files.images : [];
    const archive = req.files?.archive?.[0] || req.files?.zip?.[0] || req.files?.file?.[0] || null;

    if (!imageFiles.length && !archive) {
      return res.status(400).json({ error: "No se recibieron imagenes ni ZIP" });
    }

    let filesToProcess = imageFiles.map((file) => ({
      originalname: file.originalname,
      buffer: file.buffer,
      parsed: parseProductFileInfo(file.originalname),
    }));

    if (archive) {
      try {
        filesToProcess = await buildFilesFromZip(archive.buffer);
      } catch {
        return res.status(400).json({ error: "Formato no soportado. Usa ZIP" });
      }
    }

    filesToProcess = filesToProcess.filter((file) => file.parsed?.productCode);

    if (!filesToProcess.length) {
      return res.status(400).json({
        error: "No se encontraron imagenes validas para procesar",
      });
    }

    if (filesToProcess.length > maxFiles) {
      return res.status(400).json({
        error: `Demasiados archivos. Maximo permitido: ${maxFiles}`,
      });
    }

    const uploadedImages = [];
    const errors = [];
    let uploaded = 0;
    let skipped = 0;

    for (const file of filesToProcess) {
      try {
        const productCode = file.parsed.productCode;
        const order = Number.isFinite(file.parsed.order) ? file.parsed.order : 0;

        const product = await prisma.product.findUnique({
          where: { codigoInterno: productCode },
        });

        if (!product) {
          errors.push({
            file: file.originalname,
            code: productCode,
            error: "Producto no encontrado",
          });
          skipped++;
          continue;
        }

        const publicId = `${productCode}-${order}`;
        const uploadResult = await uploadToCloudinary(file.buffer, publicId);

        const existingImage = await prisma.productImage.findFirst({
          where: { publicId: uploadResult.public_id },
          select: { id: true },
        });

        if (existingImage) {
          await prisma.productImage.update({
            where: { id: existingImage.id },
            data: {
              url: uploadResult.secure_url,
              codigoInterno: product.codigoInterno,
              orden: order,
              esPrincipal: order === 0,
            },
          });
        } else {
          await prisma.productImage.create({
            data: {
              url: uploadResult.secure_url,
              publicId: uploadResult.public_id,
              codigoInterno: product.codigoInterno,
              orden: order,
              esPrincipal: order === 0,
            },
          });
        }

        if (order === 0) {
          await prisma.productImage.updateMany({
            where: {
              codigoInterno: product.codigoInterno,
              publicId: { not: uploadResult.public_id },
            },
            data: { esPrincipal: false },
          });
          const principalImage = await prisma.productImage.findFirst({
            where: { publicId: uploadResult.public_id },
            select: { id: true },
          });
          if (principalImage) {
            await prisma.productImage.update({
              where: { id: principalImage.id },
              data: { esPrincipal: true },
            });
          }
        }

        uploadedImages.push({
          file: file.originalname,
          productCode,
          order,
          imageUrl: uploadResult.secure_url,
        });

        uploaded++;
      } catch (err) {
        errors.push({
          file: file.originalname,
          error: err.message,
        });
        skipped++;
      }
    }

    return res.json({
      ok: true,
      mode: archive ? "zip" : "images",
      uploaded,
      skipped,
      errorsCount: errors.length,
      errors: errors.slice(0, 50),
      uploadedImages: uploadedImages.slice(0, 20),
    });
  } catch (error) {
    if (
      error?.message === "INVALID_IMAGE_FILE" ||
      error?.message === "INVALID_UPLOAD_FIELD" ||
      error?.message === "INVALID_ARCHIVE_FORMAT_USE_ZIP" ||
      error?.message === "RAR_NOT_SUPPORTED_USE_ZIP"
    ) {
      return res.status(400).json({ error: error.message });
    }
    if (error?.name === "MulterError") {
      return res.status(400).json({ error: error.message });
    }
    return res.status(500).json({ error: "Error al subir imagenes" });
  }
};

import prisma from "../config/prisma.js";
import cloudinary from "../config/cloudinary.js";
import crypto from "crypto";
import path from "path";


function extractProductCode(originalName) {
  if (!originalName) return null;
  const fileName = originalName.split("/").pop();
  const nameWithoutExt = fileName.replace(/\.[^/.]+$/, "");
  const code = nameWithoutExt.split("-")[0];

  return code.trim();
}

export const bulkImagesUpload = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: "No se recibieron imágenes" });
    }

    const uploadedImages = [];
    const errors = [];
    let uploaded = 0;
    let skipped = 0;

    for (const file of req.files) {
      try {
        const originalName = file.originalname;
        const productCode = extractProductCode(originalName)
          ?.toString()
          .trim();
        console.log("Archivo:", originalName);
        console.log("Código extraído:", productCode);
        if (!productCode) {
          errors.push({
            file: originalName,
            error: "No se pudo extraer el código del producto",
          });
          skipped++;
          continue;
        }

        const product = await prisma.product.findUnique({
          where: {
            codigoInterno: productCode,
          },
        });

        if (!product) {
          errors.push({
            file: originalName,
            code: productCode,
            error: "Producto no encontrado",
          });
          skipped++;
          continue;
        }

        // 🔥 Subir a Cloudinary desde buffer
        const uploadResult = await cloudinary.uploader.upload(
          `data:${file.mimetype};base64,${file.buffer.toString("base64")}`,
          {
            folder: "products",
            public_id: `${productCode}_${crypto.randomUUID()}`,
            overwrite: false,
          }
        );

        // Guardar imagen relacionada al producto
        await prisma.productImage.create({
          data: {
            url: uploadResult.secure_url,
            publicId: uploadResult.public_id,
            codigoInterno: product.codigoInterno,
            esPrincipal: true,
          }
        });


        uploadedImages.push({
          file: originalName,
          productCode,
          imageUrl: uploadResult.secure_url,
        });

        uploaded++;
      } catch (err) {
        console.error(`Error procesando ${file.originalname}:`, err);
        errors.push({
          file: file.originalname,
          error: err.message,
        });
        skipped++;
      }
    }

    res.json({
      ok: true,
      uploaded,
      skipped,
      errorsCount: errors.length,
      errors: errors.slice(0, 50),
      uploadedImages: uploadedImages.slice(0, 20),
    });
  } catch (error) {
    console.error("Error en bulkImagesUpload:", error);
    res.status(500).json({ error: "Error al subir imágenes" });
  }
};

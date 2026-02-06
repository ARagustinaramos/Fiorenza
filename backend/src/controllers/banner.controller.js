import prisma from "../config/prisma.js";
import cloudinary from "../config/cloudinary.js";
import crypto from "crypto";

export const createBanner = async (req, res) => {
  try {
    const { title, subtitle, link, order } = req.body;

    if (!req.file) {
      return res.status(400).json({ error: "Imagen requerida" });
    }

    const isHero = title === "hero";

    const uploadOptions = {
      folder: "banners",
    };

    if (isHero) {
      uploadOptions.public_id = "hero";
      uploadOptions.overwrite = true;
    } else {
      uploadOptions.public_id = `banner_${crypto.randomUUID()}`;
    }

    const uploadResult = await cloudinary.uploader.upload(
      `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`,
      uploadOptions
    );

    let banner;

    if (isHero) {
      // Buscar si ya existe un hero
      const existingHero = await prisma.banner.findFirst({
        where: { title: "hero" },
      });

      if (existingHero) {
        // Actualizar el existente
        banner = await prisma.banner.update({
          where: { id: existingHero.id },
          data: {
            imageUrl: uploadResult.secure_url,
            publicId: uploadResult.public_id,
          },
        });
      } else {
        // Crear el primero
        banner = await prisma.banner.create({
          data: {
            imageUrl: uploadResult.secure_url,
            publicId: uploadResult.public_id,
            title: "hero",
            order: 0,
          },
        });
      }
    } else {
      // Banners normales
      banner = await prisma.banner.create({
        data: {
          imageUrl: uploadResult.secure_url,
          publicId: uploadResult.public_id,
          title,
          subtitle,
          link,
          order: Number(order) || 0,
        },
      });
    }

    res.json(banner);
  } catch (error) {
    console.error("createBanner:", error);
    res.status(500).json({ error: "Error creando banner" });
  }
};


export const getActiveBanners = async (req, res) => {
 const banners = await prisma.banner.findMany({
  where: { active: true },
});

  res.json(banners);
};

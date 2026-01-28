import prisma from "../config/prisma.js";
import cloudinary from "../config/cloudinary.js";
import crypto from "crypto";

export const createBanner = async (req, res) => {
  try {
    const { title, subtitle, link, order } = req.body;

    if (!req.file) {
      return res.status(400).json({ error: "Imagen requerida" });
    }

    const uploadResult = await cloudinary.uploader.upload(
      `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`,
      {
        folder: "banners",
        public_id: `banner_${crypto.randomUUID()}`,
      }
    );

    const banner = await prisma.banner.create({
      data: {
        imageUrl: uploadResult.secure_url,
        publicId: uploadResult.public_id,
        title,
        subtitle,
        link,
        order: Number(order) || 0,
      },
    });

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

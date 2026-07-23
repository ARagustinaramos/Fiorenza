import prisma from "../config/prisma.js";
import cloudinary from "../config/cloudinary.js";
import crypto from "crypto";

export const createBanner = async (req, res) => {
  try {
    const { title, subtitle, link, order } = req.body;

    if (!req.file) {
      return res.status(400).json({ error: "Imagen requerida" });
    }

    const uploadOptions = {
      folder: "banners",
      public_id: `banner_${crypto.randomUUID()}`,
    };

    const uploadResult = await cloudinary.uploader.upload(
      `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`,
      uploadOptions
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
  const { title } = req.query;
  const where = { active: true };
  if (title) {
    where.title = title;
  }

  const banners = await prisma.banner.findMany({
    where,
    orderBy: { order: "asc" },
  });

  res.json(banners);
};

export const deleteBanner = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      return res.status(400).json({ error: "ID inválido" });
    }

    const banner = await prisma.banner.findUnique({ where: { id } });
    if (!banner) {
      return res.status(404).json({ error: "Banner no encontrado" });
    }

    if (banner.publicId) {
      await cloudinary.uploader.destroy(banner.publicId);
    }

    await prisma.banner.update({
      where: { id },
      data: { active: false },
    });

    res.json({ ok: true });
  } catch (error) {
    console.error("deleteBanner:", error);
    res.status(500).json({ error: "Error borrando banner" });
  }
};

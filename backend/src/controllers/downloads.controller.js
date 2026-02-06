import prisma from "../config/prisma.js";
import cloudinary from "../config/cloudinary.js";
import streamifier from "streamifier";
import axios from "axios";

export const uploadDownload = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No se envió archivo" });
    }

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: "raw",
        folder: "downloads",
      },
      async (error, result) => {
        if (error) {
          console.error(error);
          return res.status(500).json({ error: "Error al subir archivo" });
        }

        const newFile = await prisma.download.create({
          data: {
            name: req.file.originalname,
            fileUrl: result.secure_url,
            fileType: req.file.mimetype,
          },
        });

        res.json(newFile);
      }
    );

    streamifier.createReadStream(req.file.buffer).pipe(uploadStream);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error servidor" });
  }
};



export const getDownloads = async (req, res) => {
  try {
    const files = await prisma.download.findMany({
      orderBy: { createdAt: "desc" },
    });

    res.json(files);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener archivos" });
  }
};


export const deleteDownload = async (req, res) => {
  try {
    const { id } = req.params;

    const file = await prisma.download.findUnique({
      where: { id: Number(id) },
    });

    if (!file) {
      return res.status(404).json({ error: "No existe" });
    }

    await prisma.download.delete({
      where: { id: Number(id) },
    });

    res.json({ message: "Eliminado" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al borrar" });
  }
};

export const downloadFile = async (req, res) => {
  try {
    const { id } = req.params;

    const file = await prisma.download.findUnique({
      where: { id: Number(id) },
    });

    if (!file) {
      return res.status(404).json({ error: "No existe el archivo" });
    }

    const response = await axios.get(file.fileUrl, {
      responseType: "stream",
    });

    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${file.name}"`
    );
    res.setHeader(
      "Content-Type",
      file.fileType || "application/octet-stream"
    );

    response.data.pipe(res);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al descargar archivo" });
  }
};

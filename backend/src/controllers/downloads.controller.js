import prisma from "../config/prisma.js";
import fs from "fs";
import path from "path";
import axios from "axios";

export const uploadDownload = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No se envió archivo" });
    }
    const relativePath = path
      .join("uploads", "downloads", req.file.filename)
      .replace(/\\/g, "/");

    const newFile = await prisma.download.create({
      data: {
        name: req.file.originalname,
        fileUrl: relativePath,
        fileType: req.file.mimetype,
        size: req.file.size,
      },
    });

    res.json(newFile);
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

    if (file.fileUrl && !file.fileUrl.startsWith("http")) {
      const absPath = path.join(process.cwd(), file.fileUrl);
      fs.promises.unlink(absPath).catch(() => {});
    }

    await prisma.download.delete({ where: { id: Number(id) } });

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
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${file.name}"`
    );
    res.setHeader(
      "Content-Type",
      file.fileType || "application/octet-stream"
    );

    if (file.fileUrl.startsWith("http")) {
      const response = await axios.get(file.fileUrl, { responseType: "stream" });
      response.data.pipe(res);
      return;
    }

    const absPath = path.join(process.cwd(), file.fileUrl);
    res.download(absPath, file.name, (err) => {
      if (err) {
        console.error(err);
        res.status(500).json({ error: "Error al descargar archivo" });
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al descargar archivo" });
  }
};

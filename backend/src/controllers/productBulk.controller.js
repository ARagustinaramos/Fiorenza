import { fork } from "child_process";
import path from "path";
import prisma from "../config/prisma.js";

const workerPath = path.join(
  process.cwd(),
  "src",
  "workers",
  "bulkUploadWorker.js"
);

export const bulkUpload = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "Archivo requerido" });
    }

    const { mode = "upsert" } = req.body;

    const job = await prisma.bulkUploadJob.create({
      data: {
        status: "PENDING",
        mode,
        filename: req.file.originalname,
        filePath: req.file.path,
        userId: req.user?.id || null,
      },
    });

    fork(workerPath, [job.id], {
      env: {
        ...process.env,
        BULK_UPLOAD_JOB_ID: job.id,
        BULK_UPLOAD_FILE_PATH: req.file.path,
        BULK_UPLOAD_MODE: mode,
      },
      stdio: "ignore",
      cwd: process.cwd(),
    });

    return res.status(202).json({
      ok: true,
      jobId: job.id,
      status: job.status,
    });
  } catch (error) {
    console.error("[BULK UPLOAD ERROR]", error);
    return res
      .status(500)
      .json({ error: `Error carga masiva Excel: ${error.message}` });
  }
};

export const bulkUploadStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const job = await prisma.bulkUploadJob.findUnique({ where: { id } });
    if (!job) {
      return res.status(404).json({ error: "Job no encontrado" });
    }
    return res.json(job);
  } catch (error) {
    console.error("[BULK UPLOAD STATUS ERROR]", error);
    return res.status(500).json({ error: "Error consultando estado" });
  }
};

import "dotenv/config";
import fs from "fs/promises";
import prisma from "../config/prisma.js";
import { runBulkUpload } from "../services/bulkUpload.service.js";

const jobId = process.env.BULK_UPLOAD_JOB_ID || process.argv[2];
const filePath = process.env.BULK_UPLOAD_FILE_PATH;
const mode = process.env.BULK_UPLOAD_MODE || "upsert";

const safeUnlink = async (target) => {
  if (!target) return;
  try {
    await fs.unlink(target);
  } catch {}
};

const run = async () => {
  if (!jobId || !filePath) {
    process.exit(1);
  }

  try {
    await prisma.bulkUploadJob.update({
      where: { id: jobId },
      data: { status: "PROCESSING", startedAt: new Date() },
    });

    const result = await runBulkUpload({ filePath, mode });

    await prisma.bulkUploadJob.update({
      where: { id: jobId },
      data: {
        status: "COMPLETED",
        finishedAt: new Date(),
        totalRows: result.totalRows,
        inserted: result.inserted,
        skipped: result.skipped,
        errorsCount: result.errorsCount,
        errors: result.errors,
      },
    });
  } catch (error) {
    await prisma.bulkUploadJob.update({
      where: { id: jobId },
      data: {
        status: "FAILED",
        finishedAt: new Date(),
        errorMessage: error.message,
      },
    });
  } finally {
    await safeUnlink(filePath);
    await prisma.$disconnect();
  }
};

run().then(() => process.exit(0));

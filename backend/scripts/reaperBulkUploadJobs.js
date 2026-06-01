import "../src/config/loadEnv.js";
import prisma from "../src/config/prisma.js";

/**
 * Reaper de jobs PROCESSING que han estado pendientes más de X minutos
 * Ejecutar con: node scripts/reaperBulkUploadJobs.js
 * O configurar como cron job que corra cada N minutos
 *
 * TIMEOUT_MINUTES: tiempo máximo que un job puede estar en PROCESSING (default: 30 min)
 */

const TIMEOUT_MINUTES = Number(process.env.BULK_UPLOAD_TIMEOUT_MINUTES || 30);
const TIMEOUT_MS = TIMEOUT_MINUTES * 60 * 1000;

const run = async () => {
  const cutoffTime = new Date(Date.now() - TIMEOUT_MS);

  console.log(`[REAPER] Buscando jobs PROCESSING iniciados antes de ${cutoffTime.toISOString()}...`);

  const timedOutJobs = await prisma.bulkUploadJob.findMany({
    where: {
      status: "PROCESSING",
      startedAt: {
        lt: cutoffTime,
      },
    },
  });

  if (timedOutJobs.length === 0) {
    console.log("[REAPER] No hay jobs con timeout.");
    return;
  }

  console.log(`[REAPER] Encontrados ${timedOutJobs.length} jobs con timeout.`);

  // Actualizar cada job que ha estado en PROCESSING más allá del timeout
  const updates = timedOutJobs.map((job) =>
    prisma.bulkUploadJob.update({
      where: { id: job.id },
      data: {
        status: "FAILED",
        finishedAt: new Date(),
        errorMessage: `Job procesamiento excedió timeout de ${TIMEOUT_MINUTES} minutos`,
      },
    })
  );

  const results = await Promise.allSettled(updates);
  const succeeded = results.filter((r) => r.status === "fulfilled").length;
  const failed = results.filter((r) => r.status === "rejected").length;

  console.log(`[REAPER] Actualizados ${succeeded} jobs, ${failed} errores`);
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});

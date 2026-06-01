import "../src/config/loadEnv.js";
import prisma from "../src/config/prisma.js";

/**
 * Script para limpiar jobs de BulkUploadJob que quedaron en PROCESSING sin finishedAt
 * Ejecutar con: node scripts/cleanupStuckBulkUploadJobs.js
 */

const run = async () => {
  console.log(
    "[CLEANUP] Iniciando búsqueda de jobs en PROCESSING sin finishedAt..."
  );

  const stuckJobs = await prisma.bulkUploadJob.findMany({
    where: {
      status: "PROCESSING",
      finishedAt: null,
    },
  });

  if (stuckJobs.length === 0) {
    console.log("[CLEANUP] No hay jobs en PROCESSING sin finishedAt.");
    await prisma.$disconnect();
    process.exit(0);
  }

  console.log(`[CLEANUP] Encontrados ${stuckJobs.length} jobs huérfanos:`);
  stuckJobs.forEach((job) => {
    console.log(`  - ID: ${job.id}`);
    console.log(`    inserted: ${job.inserted}, skipped: ${job.skipped}, totalRows: ${job.totalRows}`);
    console.log(`    errorsCount: ${job.errorsCount}`);
    console.log(`    startedAt: ${job.startedAt}`);
    console.log();
  });

  console.log("[CLEANUP] Finalizando jobs huérfanos...");

  // Actualizar jobs: si inserted + skipped == totalRows y errorsCount == 0, marcar como COMPLETED
  // Si no, marcar como FAILED por timeout
  const updates = [];

  for (const job of stuckJobs) {
    if (
      job.totalRows > 0 &&
      job.inserted + job.skipped === job.totalRows &&
      job.errorsCount === 0
    ) {
      console.log(
        `[CLEANUP] Job ${job.id}: datos completos, marcando como COMPLETED`
      );
      updates.push(
        prisma.bulkUploadJob.update({
          where: { id: job.id },
          data: {
            status: "COMPLETED",
            finishedAt: new Date(),
            errorMessage: null,
          },
        })
      );
    } else {
      console.log(
        `[CLEANUP] Job ${job.id}: datos incompletos, marcando como FAILED (timeout)`
      );
      updates.push(
        prisma.bulkUploadJob.update({
          where: { id: job.id },
          data: {
            status: "FAILED",
            finishedAt: new Date(),
            errorMessage:
              "Job stuck in PROCESSING - likely killed or timed out. Data may be incomplete.",
          },
        })
      );
    }
  }

  await Promise.all(updates);
  console.log("[CLEANUP] ✅ Cleanup completado");
  await prisma.$disconnect();
  process.exit(0);
};

run().catch((err) => {
  console.error("[CLEANUP ERROR]", err);
  process.exit(1);
});

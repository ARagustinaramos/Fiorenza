import ExcelJS from "exceljs";
import path from "path";
import prisma from "../config/prisma.js";

const CHUNK_SIZE = Number(process.env.BULK_CHUNK_SIZE || 500);
const PARALLELISM = Number(process.env.BULK_PARALLELISM || 20);

const runInBatches = async (items, batchSize, handler) => {
  for (let i = 0; i < items.length; i += batchSize) {
    const slice = items.slice(i, i + batchSize);
    const results = await Promise.all(slice.map(handler));
    for (const r of results) {
      if (r !== undefined) {
        // allow caller to collect results if needed
      }
    }
  }
};

const normalizeHeader = (text) => {
  if (text === null || text === undefined) return "";
  return text
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .trim()
    .replace(/\s+/g, " ");
};

const getCellValue = (cell) => {
  if (!cell) return "";
  if (cell.value !== undefined && cell.value !== null) {
    // Formula cells: ExcelJS stores { formula, result }
    if (typeof cell.value === "object" && cell.value.result !== undefined) {
      return cell.value.result;
    }
    // Rich text: join text fragments
    if (typeof cell.value === "object" && Array.isArray(cell.value.richText)) {
      return cell.value.richText.map((t) => t.text).join("");
    }
    // Hyperlinks keep the display text
    if (typeof cell.value === "object" && cell.value.text !== undefined) {
      return cell.value.text;
    }
    return cell.value;
  }
  if (typeof cell === "object" && cell.text !== undefined) return cell.text;
  return cell.toString();
};

const REQUIRED_COLUMNS = [
  "CODIGO INTERNO",
  "PRECIO PUBLICO FINAL CON IVA",
  "PRECIO MAYORISTA SIN IVA",
];

const sanitizeText = (value) =>
  value ? value.toString().replace(/\s+/g, " ").trim() : "";

const normalizeBoolean = (value) =>
  ["si", "sÃ­", "true", "1"].includes(value?.toString().trim().toLowerCase());

const parseNumber = (value) => {
  if (value === null || value === undefined) return null;
  if (typeof value === "number") return Number.isFinite(value) ? value : null;

  let text = value.toString().trim();
  if (!text) return null;

  // Remove currency symbols and spaces
  text = text.replace(/\s+/g, "");
  text = text.replace(/[^0-9,.-]/g, "");

  const lastComma = text.lastIndexOf(",");
  const lastDot = text.lastIndexOf(".");

  if (lastComma !== -1 && lastDot !== -1) {
    if (lastComma > lastDot) {
      // 1.234,56 -> 1234.56
      text = text.replace(/\./g, "").replace(",", ".");
    } else {
      // 1,234.56 -> 1234.56
      text = text.replace(/,/g, "");
    }
  } else if (lastComma !== -1) {
    // 1234,56 -> 1234.56
    text = text.replace(",", ".");
  }

  const parsed = parseFloat(text);
  return Number.isFinite(parsed) ? parsed : null;
};

const mapExcelToProduct = (row) => ({
  codigoInterno: sanitizeText(row["CODIGO INTERNO"]),
  codigoOriginal: (row["CODIGO ORIGINAL"]?.toString() ?? "").trim(),
  descripcion: sanitizeText(row["DESCRIPCION"]),
  descripcionAdicional: sanitizeText(row["DESCRIPCION ADICIONAL"]),
  stock: parseNumber(row["STOCK"]) || 0,
  precioConIva: parseNumber(row["PRECIO PUBLICO FINAL CON IVA"]) || 0,
  precioMayoristaSinIva: parseNumber(row["PRECIO MAYORISTA SIN IVA"]),
  marcaNombre: sanitizeText(row["MARCA"]),
  familiaNombre: sanitizeText(row["FAMILIA"]),
  rubro: sanitizeText(row["RUBRO"]),
  esNovedad: normalizeBoolean(row["NOVEDADES"]),
  esOferta: normalizeBoolean(row["OFERTAS"]),
  baja: normalizeBoolean(row["BAJA"]),
});

// Helper para sincronizar Marcas y Familias en lote
const syncMetadata = async (items, brandCache, familyCache) => {
  const brandsToSync = new Set();
  const familiesToSync = new Set();

  items.forEach((item) => {
    if (item.marcaNombre) brandsToSync.add(item.marcaNombre);
    if (item.familiaNombre) familiesToSync.add(item.familiaNombre);
  });

  const syncEntity = async (namesSet, cache, model) => {
    const names = Array.from(namesSet).filter((n) => !cache.has(n));
    if (names.length === 0) return;

    // 1. Buscar existentes
    const existing = await model.findMany({ where: { nombre: { in: names } } });
    existing.forEach((e) => cache.set(e.nombre, e));

    // 2. Crear faltantes (ahora con unique en nombre)
    const missing = names.filter((n) => !cache.has(n));
    if (missing.length === 0) return;

    // Crear en lote y evitar duplicados
    await model.createMany({
      data: missing.map((nombre) => ({ nombre })),
      skipDuplicates: true,
    });

    // Recargar los nuevos para el cache
    const createdNow = await model.findMany({
      where: { nombre: { in: missing } },
    });
    createdNow.forEach((e) => cache.set(e.nombre, e));
  };

  await Promise.all([
    syncEntity(brandsToSync, brandCache, prisma.brand),
    syncEntity(familiesToSync, familyCache, prisma.family),
  ]);
};

const loadWorkbookFromFile = async (filePath) => {
  const workbook = new ExcelJS.Workbook();
  const ext = path.extname(filePath).toLowerCase();
  if (ext === ".csv") {
    await workbook.csv.readFile(filePath);
  } else {
    await workbook.xlsx.readFile(filePath);
  }
  return workbook;
};

const isTransientDbError = (err) => {
  if (!err) return false;
  const msg = (err.message || "").toLowerCase();
  return (
    msg.includes("can't reach database server") ||
    msg.includes("max clients") ||
    msg.includes("pool") ||
    msg.includes("timed out") ||
    msg.includes("p2024")
  );
};

const withRetry = async (fn, retries = 3) => {
  let attempt = 0;
  while (true) {
    try {
      return await fn();
    } catch (err) {
      attempt += 1;
      if (!isTransientDbError(err) || attempt > retries) throw err;
      const delay = Math.min(2000 * attempt, 8000);
      await new Promise((r) => setTimeout(r, delay));
    }
  }
};

export const runBulkUpload = async ({ filePath, mode = "upsert" }) => {
  if (mode === "replace") {
    await withRetry(() =>
      prisma.product.updateMany({
      data: { activo: false },
      })
    );
  }

  const workbook = await loadWorkbookFromFile(filePath);

  let totalRows = 0;
  let inserted = 0;
  let skipped = 0;
  const errors = [];

  const brandCache = new Map();
  const familyCache = new Map();

  for (const worksheet of workbook.worksheets) {
    const headerRow = worksheet.getRow(1);
    const headers = headerRow.values.slice(1).map((h) => normalizeHeader(h));

    if (mode !== "delete") {
      const missingColumns = REQUIRED_COLUMNS.filter(
        (col) => !headers.includes(col)
      );
      if (missingColumns.length) {
        throw new Error(
          `Columnas faltantes en hoja ${worksheet.name}: ${missingColumns.join(", ")}`
        );
      }
    } else if (!headers.includes("CODIGO INTERNO")) {
      throw new Error(
        `Columna CODIGO INTERNO faltante en hoja ${worksheet.name}`
      );
    }

    let batch = [];

    for (let i = 2; i <= worksheet.rowCount; i++) {
      const row = worksheet.getRow(i);
      totalRows++;

      const rowData = {};
      headers.forEach((header, idx) => {
        rowData[header] = getCellValue(row.getCell(idx + 1));
      });

      try {
        const item = mapExcelToProduct(rowData);
        batch.push({ item, rowNumber: i });
      } catch (err) {
        skipped++;
        errors.push({
          sheet: worksheet.name,
          row: i,
          error: err.message.split("|"),
        });
      }

      if (batch.length === CHUNK_SIZE || i === worksheet.rowCount) {
        if (batch.length === 0) continue;

        if (mode === "delete") {
          const validDeletes = [];
          for (const { item, rowNumber } of batch) {
            if (!item.codigoInterno) {
              skipped++;
              errors.push({
                sheet: worksheet.name,
                row: rowNumber,
                error: "MISSING_CODE",
              });
            } else {
              validDeletes.push(item.codigoInterno);
            }
          }

          if (validDeletes.length > 0) {
            const result = await prisma.product.updateMany({
              where: { codigoInterno: { in: validDeletes } },
              data: { activo: false },
            });
            inserted += result.count;
          }

          batch = [];
          continue;
        }

        await withRetry(() =>
          syncMetadata(batch.map((b) => b.item), brandCache, familyCache)
        );

        const codigos = batch.map((b) => b.item.codigoInterno).filter(Boolean);
        const existingProducts = await withRetry(() =>
          prisma.product.findMany({
            where: { codigoInterno: { in: codigos } },
          })
        );

        const productMap = new Map();
        existingProducts.forEach((p) => productMap.set(p.codigoInterno, p));

        const toCreate = [];
        const toUpdate = [];

        const perRowErrors = [];

        batch.forEach(({ item, rowNumber }) => {
          try {
            const validationErrors = [];
            if (!item.codigoInterno) validationErrors.push("MISSING_CODE");
            if (isNaN(item.precioConIva) || item.precioConIva <= 0)
              validationErrors.push("INVALID_PRICE");

            if (validationErrors.length) {
              throw new Error(validationErrors.join("|"));
            }

            const marca = brandCache.get(item.marcaNombre);
            const familia = familyCache.get(item.familiaNombre);
            const existingProduct = productMap.get(item.codigoInterno);

            const commonData = {
              codigoInterno: item.codigoInterno,
              codigoOriginal: item.codigoOriginal,
              descripcion: item.descripcion,
              descripcionAdicional: item.descripcionAdicional,
              precioConIva: item.precioConIva,
              precioMayoristaSinIva: item.precioMayoristaSinIva,
              stock: item.stock,
              marcaId: marca ? marca.id : null,
              familiaId: familia ? familia.id : null,
              rubro: item.rubro,
              esOferta: item.esOferta,
              esNovedad: item.esNovedad,
              activo: true,
            };

            if (mode === "update") {
              if (!existingProduct) {
                perRowErrors.push({ status: "skipped" });
                return;
              }
              toUpdate.push({ id: existingProduct.id, data: commonData });
              return;
            }

            if (mode === "create") {
              if (existingProduct) {
                if (!existingProduct.activo) {
                  toUpdate.push({ id: existingProduct.id, data: commonData });
                  return;
                }
                perRowErrors.push({ status: "skipped" });
                return;
              }
              toCreate.push(commonData);
              return;
            }

            if (existingProduct) {
              toUpdate.push({ id: existingProduct.id, data: commonData });
            } else {
              toCreate.push(commonData);
            }
            return;
          } catch (err) {
            perRowErrors.push({
              status: "error",
              sheet: worksheet.name,
              row: rowNumber,
              error: err.message.split("|"),
            });
          }
        });

        if (toCreate.length > 0) {
          const created = await withRetry(() =>
            prisma.product.createMany({
              data: toCreate,
              skipDuplicates: true,
            })
          );
          inserted += created.count;
        }

        for (let i = 0; i < toUpdate.length; i += PARALLELISM) {
          const slice = toUpdate.slice(i, i + PARALLELISM);
          const settled = await Promise.all(
            slice.map(({ id, data }) =>
              withRetry(() =>
                prisma.product.update({
                  where: { id },
                  data,
                })
              )
            )
          );
          inserted += settled.length;
        }

        perRowErrors.forEach((r) => {
          if (r.status === "skipped") skipped++;
          if (r.status === "error") {
            skipped++;
            errors.push({ sheet: r.sheet, row: r.row, error: r.error });
          }
        });

        batch = [];
      }
    }
  }

  return {
    totalRows,
    inserted,
    skipped,
    errorsCount: errors.length,
    errors: errors.slice(0, 200),
  };
};

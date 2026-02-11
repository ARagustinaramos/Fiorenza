import ExcelJS from "exceljs";
import path from "path";
import prisma from "../config/prisma.js";

const CHUNK_SIZE = Number(process.env.BULK_CHUNK_SIZE || 500);

const normalizeHeader = (text) =>
  text?.toString().toUpperCase().trim().replace(/\s+/g, " ");

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

    // 2. Crear faltantes (sin upsert porque nombre no es unique)
    const missing = names.filter((n) => !cache.has(n));
    await Promise.all(
      missing.map(async (name) => {
        const already = await model.findFirst({ where: { nombre: name } });
        if (already) {
          cache.set(name, already);
          return;
        }
        try {
          const created = await model.create({ data: { nombre: name } });
          cache.set(name, created);
        } catch {
          const fallback = await model.findFirst({ where: { nombre: name } });
          if (fallback) cache.set(name, fallback);
        }
      })
    );
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

export const runBulkUpload = async ({ filePath, mode = "upsert" }) => {
  if (mode === "replace") {
    await prisma.product.updateMany({
      data: { activo: false },
    });
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

        await syncMetadata(batch.map((b) => b.item), brandCache, familyCache);

        const codigos = batch.map((b) => b.item.codigoInterno).filter(Boolean);
        const existingProducts = await prisma.product.findMany({
          where: { codigoInterno: { in: codigos } },
        });

        const productMap = new Map();
        existingProducts.forEach((p) => productMap.set(p.codigoInterno, p));

        const promises = batch.map(async ({ item, rowNumber }) => {
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
              if (!existingProduct) return { status: "skipped" };
              await prisma.product.update({
                where: { id: existingProduct.id },
                data: commonData,
              });
              return { status: "inserted" };
            }

            if (mode === "create") {
              if (existingProduct) {
                if (!existingProduct.activo) {
                  await prisma.product.update({
                    where: { id: existingProduct.id },
                    data: commonData,
                  });
                  return { status: "inserted" };
                }
                return { status: "skipped" };
              }
              await prisma.product.create({ data: commonData });
              return { status: "inserted" };
            }

            if (existingProduct) {
              await prisma.product.update({
                where: { id: existingProduct.id },
                data: commonData,
              });
            } else {
              await prisma.product.create({ data: commonData });
            }
            return { status: "inserted" };
          } catch (err) {
            return {
              status: "error",
              sheet: worksheet.name,
              row: rowNumber,
              error: err.message.split("|"),
            };
          }
        });

        const results = await Promise.all(promises);

        results.forEach((r) => {
          if (r.status === "inserted") inserted++;
          else if (r.status === "skipped") skipped++;
          else if (r.status === "error") {
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

import ExcelJS from "exceljs";
import prisma from "../config/prisma.js";

const CHUNK_SIZE = 500;

const normalizeHeader = (text) =>
  text?.toString().toUpperCase().trim().replace(/\s+/g, " ");

const getCellValue = (cell) => {
  if (!cell) return "";
  if (typeof cell === "object" && cell.text !== undefined) return cell.text;
  return cell.toString();
};

const REQUIRED_COLUMNS = [
  "CODIGO INTERNO",
  "PRECIO PUBLICO FINAL CON IVA",
];

const sanitizeText = (value) =>
  value ? value.toString().replace(/\s+/g, " ").trim() : "";

const normalizeBoolean = (value) =>
  ["si", "sí", "true", "1"].includes(value?.toString().trim().toLowerCase());

const mapExcelToProduct = (row) => ({
  codigoInterno: sanitizeText(row["CODIGO INTERNO"]),
  codigoOriginal: (row["CODIGO ORIGINAL"]?.toString() ?? "").trim(),
  descripcion: sanitizeText(row["DESCRIPCION"]),
  descripcionAdicional: sanitizeText(row["DESCRIPCION ADICIONAL"]),
  stock: Number(row["STOCK"]) || 0,
  precioConIva: Number(row["PRECIO PUBLICO FINAL CON IVA"]),
  precioConIva: Number(row["PRECIO PUBLICO FINAL CON IVA"]) || 0,
  precioMayoristaSinIva: Number(row["PRECIO MAYORISTA SIN IVA"]) || null,
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

    // 2. Crear faltantes
    const missing = names.filter((n) => !cache.has(n));
    await Promise.all(
      missing.map(async (name) => {
        // upsert o create con manejo de error por si otro proceso lo crea
        const created = await model.upsert({
          where: { nombre: name },
          update: {},
          create: { nombre: name },
        });
        cache.set(name, created);
      })
    );
  };

  await Promise.all([
    syncEntity(brandsToSync, brandCache, prisma.brand),
    syncEntity(familiesToSync, familyCache, prisma.family),
  ]);
};

export const bulkUpload = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "Archivo requerido" });
    }

    const { mode = "upsert" } = req.body; 
    console.log(`[BULK UPLOAD] Iniciando modo: ${mode}`);
    console.log(`[BULK UPLOAD] Body recibido:`, req.body);

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(req.file.buffer);

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
          return res.status(400).json({
            error: `Columnas faltantes en hoja ${worksheet.name}`,
            missingColumns,
          });
        }
      } else {
    
        if (!headers.includes("CODIGO INTERNO")) {
          return res.status(400).json({
            error: `Columna CODIGO INTERNO faltante en hoja ${worksheet.name}`,
          });
        }
      }

      let batch = [];

      for (let i = 2; i <= worksheet.rowCount; i++) {
        const row = worksheet.getRow(i);
        totalRows++;

        const rowData = {};
        headers.forEach((header, idx) => {
          rowData[header] = getCellValue(row.getCell(idx + 1));
        });

        // Mapeamos inmediatamente para tener el objeto limpio
        try {
          const item = mapExcelToProduct(rowData);
          batch.push({ item, rowNumber: i });
        } catch (err) {
          skipped++;
          errors.push({
            sheet: worksheet.name,
            row: i,
            error: err.message,
          });
        }

        // Procesar Batch
        if (batch.length === CHUNK_SIZE || i === worksheet.rowCount) {
          if (batch.length === 0) continue;

          /* =========================
             MODO DELETE (Optimizado)
          ========================= */
          if (mode === "delete") {
            const validDeletes = [];
            
            for (const { item, rowNumber } of batch) {
              if (!item.codigoInterno) {
                skipped++;
                errors.push({
                  sheet: worksheet.name,
                  row: rowNumber,
                  error: "codigoInterno inválido",
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

          /* =========================
             MODO UPSERT / CREATE / UPDATE
          ========================= */
          
          // 1. Sincronizar Marcas y Familias del batch
          await syncMetadata(batch.map(b => b.item), brandCache, familyCache);

          // 2. Buscar productos existentes en el batch
          const codigos = batch.map(b => b.item.codigoInterno).filter(Boolean);
          const existingProducts = await prisma.product.findMany({
            where: { codigoInterno: { in: codigos } },
          });
          
          const productMap = new Map();
          existingProducts.forEach(p => productMap.set(p.codigoInterno, p));

          // 3. Ejecutar operaciones en paralelo
          const promises = batch.map(async ({ item, rowNumber }) => {
            try {
              // Validaciones básicas
              const validationErrors = [];
              if (!item.codigoInterno) validationErrors.push("codigoInterno vacío");
              if (!item.descripcion) validationErrors.push("descripcion vacía");
              if (isNaN(item.precioConIva) || item.precioConIva <= 0)
                validationErrors.push("precio inválido");

              if (validationErrors.length) {
                throw new Error(validationErrors.join(", "));
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
                marca: marca ? { connect: { id: marca.id } } : undefined,
                familia: familia ? { connect: { id: familia.id } } : undefined,
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
                  return { status: "skipped" }; // Ya existe y está activo
                }
                await prisma.product.create({ data: commonData });
                return { status: "inserted" };
              }

              // Mode UPSERT (Default)
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
                error: err.message,
              };
            }
          });

          const results = await Promise.all(promises);
          
          // Agregar resultados a contadores
          results.forEach(r => {
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

    return res.json({
      ok: true,
      mode: mode,
      totalRows,
      inserted,
      skipped,
      errorsCount: errors.length,
      errors: errors.slice(0, 50),
    });
  } catch (error) {
    console.error("[BULK UPLOAD ERROR]", error);
    res.status(500).json({ error: `Error carga masiva Excel: ${error.message}` });
  }
};
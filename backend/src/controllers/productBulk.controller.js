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
  "CODIGO ORIGINAL",
  "DESCRIPCION",
  "PRECIO PUBLICO FINAL CON IVA",
  "MARCA",
  "FAMILIA",
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
  precioMayoristaSinIva: Number(row["PRECIO MAYORISTA SIN IVA"]) || null,
  marcaNombre: sanitizeText(row["MARCA"]),
  familiaNombre: sanitizeText(row["FAMILIA"]),
  rubro: sanitizeText(row["RUBRO"]),
  esNovedad: normalizeBoolean(row["NOVEDADES"]),
  esOferta: normalizeBoolean(row["OFERTAS"]),
  baja: normalizeBoolean(row["BAJA"]),
});


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

      let buffer = [];

      for (let i = 2; i <= worksheet.rowCount; i++) {
        const row = worksheet.getRow(i);
        totalRows++;

        const rowData = {};
        headers.forEach((header, idx) => {
          rowData[header] = getCellValue(row.getCell(idx + 1));
        });

        buffer.push({ rowData, rowNumber: i });

        if (buffer.length === CHUNK_SIZE || i === worksheet.rowCount) {
          for (const { rowData, rowNumber } of buffer) {
            try {
              const item = mapExcelToProduct(rowData);

              console.log(`[BULK DEBUG] Fila ${rowNumber} - CodigoInterno: "${item.codigoInterno}"`);

              
              if (mode === "delete") {
                if (!item.codigoInterno) {
                  skipped++;
                  errors.push({
                    sheet: worksheet.name,
                    row: rowNumber,
                    error: "codigoInterno inválido",
                  });
                  continue;
                }

                console.log(`[DELETE] Buscando producto con codigoInterno: ${item.codigoInterno}`);

                const existingProduct = await prisma.product.findFirst({
                  where: { codigoInterno: item.codigoInterno },
                });

                console.log(`[DELETE] Producto encontrado:`, existingProduct ? "SÍ" : "NO");

                if (!existingProduct) {
                  skipped++;
                  continue;
                }

                console.log(`[DELETE] Marcando como inactivo: ${existingProduct.id}`);

                await prisma.product.update({
                  where: { id: existingProduct.id },
                  data: { activo: false },
                });

                console.log(`[DELETE] ✅ Producto ${existingProduct.id} marcado como inactivo`);

                inserted++;
                continue;
              }

              const validationErrors = [];
              if (!item.codigoInterno) validationErrors.push("codigoInterno vacío");
              if (!item.descripcion) validationErrors.push("descripcion vacía");
              if (isNaN(item.precioConIva) || item.precioConIva <= 0)
                validationErrors.push("precio inválido");

              if (validationErrors.length) {
                console.log(`[BULK DEBUG] Errores validación fila ${rowNumber}:`, validationErrors);
                skipped++;
                errors.push({
                  sheet: worksheet.name,
                  row: rowNumber,
                  error: validationErrors.join(", "),
                });
                continue;
              }

              let marca = brandCache.get(item.marcaNombre);
              if (!marca) {
                marca =
                  (await prisma.brand.findFirst({
                    where: { nombre: item.marcaNombre },
                  })) ||
                  (await prisma.brand.create({
                    data: { nombre: item.marcaNombre },
                  }));
                brandCache.set(item.marcaNombre, marca);
              }

              let familia = familyCache.get(item.familiaNombre);
              if (!familia) {
                familia =
                  (await prisma.family.findFirst({
                    where: { nombre: item.familiaNombre },
                  })) ||
                  (await prisma.family.create({
                    data: { nombre: item.familiaNombre },
                  }));
                familyCache.set(item.familiaNombre, familia);
              }

              const existingProduct = await prisma.product.findFirst({
                where: { codigoInterno: item.codigoInterno },
              });

              console.log(`[BULK DEBUG] Buscando ${item.codigoInterno} -> Encontrado: ${!!existingProduct}`);

           
              if (mode === "update") {
                if (!existingProduct) {
                  skipped++;
                  continue;
                }

                await prisma.product.update({
                  where: { id: existingProduct.id },
                  data: {
                    codigoInterno: item.codigoInterno,
                    codigoOriginal: item.codigoOriginal,
                    descripcion: item.descripcion,
                    descripcionAdicional: item.descripcionAdicional,
                    precioConIva: item.precioConIva,
                    precioMayoristaSinIva: item.precioMayoristaSinIva,
                    stock: item.stock,
                    marca: { connect: { id: marca.id } },
                    familia: { connect: { id: familia.id } },
                    rubro: item.rubro,
                    esOferta: item.esOferta,
                    esNovedad: item.esNovedad,
                    activo: true,
                  },
                });

                inserted++;
                continue;
              }

              if (mode === "create") {
                if (existingProduct) {
                  
                  if (!existingProduct.activo) {
                    console.log(`[BULK DEBUG] Reactivando producto inactivo: ${item.codigoInterno}`);
                    await prisma.product.update({
                      where: { id: existingProduct.id },
                      data: {
                        codigoInterno: item.codigoInterno,
                        codigoOriginal: item.codigoOriginal,
                        descripcion: item.descripcion,
                        descripcionAdicional: item.descripcionAdicional,
                        precioConIva: item.precioConIva,
                        precioMayoristaSinIva: item.precioMayoristaSinIva,
                        stock: item.stock,
                        marca: { connect: { id: marca.id } },
                        familia: { connect: { id: familia.id } },
                        rubro: item.rubro,
                        esOferta: item.esOferta,
                        esNovedad: item.esNovedad,
                        activo: true,
                      },
                    });
                    inserted++;
                    continue;
                  }

                  console.log(`[BULK DEBUG] SKIP CREATE (Ya existe): ${item.codigoInterno}`);
                  skipped++;
                  continue;
                }

                await prisma.product.create({
                  data: {
                    codigoInterno: item.codigoInterno,
                    codigoOriginal: item.codigoOriginal,
                    descripcion: item.descripcion,
                    descripcionAdicional: item.descripcionAdicional,
                    precioConIva: item.precioConIva,
                    precioMayoristaSinIva: item.precioMayoristaSinIva,
                    stock: item.stock,
                    marca: { connect: { id: marca.id } },
                    familia: { connect: { id: familia.id } },
                    rubro: item.rubro,
                    esOferta: item.esOferta,
                    esNovedad: item.esNovedad,
                    activo: true,
                  },
                });

                inserted++;
                continue;
              }

             
              if (existingProduct) {
                await prisma.product.update({
                  where: { id: existingProduct.id },
                  data: {
                    codigoInterno: item.codigoInterno,
                    codigoOriginal: item.codigoOriginal,
                    descripcion: item.descripcion,
                    descripcionAdicional: item.descripcionAdicional,
                    precioConIva: item.precioConIva,
                    precioMayoristaSinIva: item.precioMayoristaSinIva,
                    stock: item.stock,
                    marca: { connect: { id: marca.id } },
                    familia: { connect: { id: familia.id } },
                    rubro: item.rubro,
                    esOferta: item.esOferta,
                    esNovedad: item.esNovedad,
                    activo: true,
                  },
                });
              } else {
                await prisma.product.create({
                  data: {
                    codigoInterno: item.codigoInterno,
                    codigoOriginal: item.codigoOriginal,
                    descripcion: item.descripcion,
                    descripcionAdicional: item.descripcionAdicional,
                    precioConIva: item.precioConIva,
                    precioMayoristaSinIva: item.precioMayoristaSinIva,
                    stock: item.stock,
                    marca: { connect: { id: marca.id } },
                    familia: { connect: { id: familia.id } },
                    rubro: item.rubro,
                    esOferta: item.esOferta,
                    esNovedad: item.esNovedad,
                    activo: true,
                  },
                });
              }

              inserted++;
            } catch (err) {
              skipped++;
              errors.push({
                sheet: worksheet.name,
                row: rowNumber,
                error: err.message,
              });
            }
          }

          buffer = [];
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
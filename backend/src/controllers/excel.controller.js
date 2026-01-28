import ExcelJS from "exceljs";
import prisma from "../config/prisma.js";

const CHUNK_SIZE = 500;

export const bulkUpload = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "Archivo requerido" });
    }

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(req.file.buffer);

    let totalRows = 0;
    let inserted = 0;
    let skipped = 0;
    const errors = [];

    for (const worksheet of workbook.worksheets) {
      const headers = [];

      worksheet.getRow(1).eachCell((cell) => {
        headers.push(cell.text.trim());
      });

      for (let i = 2; i <= worksheet.rowCount; i += CHUNK_SIZE) {
        const chunkEnd = Math.min(i + CHUNK_SIZE - 1, worksheet.rowCount);

        for (let rowIndex = i; rowIndex <= chunkEnd; rowIndex++) {
          const row = worksheet.getRow(rowIndex);
          totalRows++;

          try {
            const rowData = {};
            headers.forEach((header, idx) => {
              rowData[header] = row.getCell(idx + 1).text;
            });

            const item = mapExcelToProduct(rowData);

            if (!item.codigoInterno || !item.codigoOriginal) {
              skipped++;
              continue;
            }

            // upsert marca, familia, producto...
            inserted++;
          } catch (err) {
            skipped++;
            errors.push({
              sheet: worksheet.name,
              row: rowIndex,
              error: err.message,
            });
          }
        }
      }
    }

    res.json({
      ok: true,
      totalRows,
      inserted,
      skipped,
      errors: errors.slice(0, 50),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error carga Excel" });
  }
};

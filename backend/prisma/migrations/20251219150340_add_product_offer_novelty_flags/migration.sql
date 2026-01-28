/*
  Warnings:

  - You are about to alter the column `precioConIva` on the `Product` table. The data in that column could be lost. The data in that column will be cast from `Decimal(10,2)` to `DoublePrecision`.
  - You are about to alter the column `precioMayoristaSinIva` on the `Product` table. The data in that column could be lost. The data in that column will be cast from `Decimal(10,2)` to `DoublePrecision`.
  - Changed the type of `codigoOriginal` on the `Product` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- DropIndex
DROP INDEX "Product_familiaId_idx";

-- DropIndex
DROP INDEX "Product_marcaId_idx";

-- DropIndex
DROP INDEX "product_familia_idx";

-- DropIndex
DROP INDEX "product_marca_idx";

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "esNovedad" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "esOferta" BOOLEAN NOT NULL DEFAULT false,
DROP COLUMN "codigoOriginal",
ADD COLUMN     "codigoOriginal" INTEGER NOT NULL,
ALTER COLUMN "precioConIva" SET DATA TYPE DOUBLE PRECISION,
ALTER COLUMN "precioMayoristaSinIva" SET DATA TYPE DOUBLE PRECISION;

-- CreateIndex
CREATE UNIQUE INDEX "Product_codigoOriginal_key" ON "Product"("codigoOriginal");

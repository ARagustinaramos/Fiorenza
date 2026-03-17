-- CreateEnum
CREATE TYPE "Catalogo" AS ENUM ('MAYORISTA', 'MINORISTA');

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "catalogo" "Catalogo" NOT NULL DEFAULT 'MAYORISTA';

-- CreateIndex
CREATE INDEX "Product_catalogo_idx" ON "Product"("catalogo");

-- DropForeignKey
ALTER TABLE "Product" DROP CONSTRAINT "Product_familiaId_fkey";

-- DropForeignKey
ALTER TABLE "Product" DROP CONSTRAINT "Product_marcaId_fkey";

-- AlterTable
ALTER TABLE "Product" ALTER COLUMN "descripcion" DROP NOT NULL,
ALTER COLUMN "marcaId" DROP NOT NULL,
ALTER COLUMN "familiaId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_marcaId_fkey" FOREIGN KEY ("marcaId") REFERENCES "Brand"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_familiaId_fkey" FOREIGN KEY ("familiaId") REFERENCES "Family"("id") ON DELETE SET NULL ON UPDATE CASCADE;

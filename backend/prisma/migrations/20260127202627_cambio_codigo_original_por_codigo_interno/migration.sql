/*
  Warnings:

  - You are about to drop the column `productId` on the `ProductImage` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "ProductImage" DROP CONSTRAINT "ProductImage_productId_fkey";

-- DropIndex
DROP INDEX "ProductImage_productId_idx";

-- AlterTable
ALTER TABLE "ProductImage" DROP COLUMN "productId",
ADD COLUMN     "codigoInterno" TEXT;

-- CreateIndex
CREATE INDEX "ProductImage_codigoInterno_idx" ON "ProductImage"("codigoInterno");

-- AddForeignKey
ALTER TABLE "ProductImage" ADD CONSTRAINT "ProductImage_codigoInterno_fkey" FOREIGN KEY ("codigoInterno") REFERENCES "Product"("codigoInterno") ON DELETE SET NULL ON UPDATE CASCADE;

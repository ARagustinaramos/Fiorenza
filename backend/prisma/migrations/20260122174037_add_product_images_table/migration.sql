/*
  Warnings:

  - You are about to drop the column `imagenes` on the `Product` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Product" DROP COLUMN "imagenes",
ADD COLUMN     "codigoOriginalNormalizado" TEXT;

-- CreateTable
CREATE TABLE "ProductImage" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "publicId" TEXT,
    "codigoOriginal" TEXT NOT NULL,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "esPrincipal" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductImage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProductImage_codigoOriginal_idx" ON "ProductImage"("codigoOriginal");

-- CreateIndex
CREATE INDEX "Product_codigoOriginalNormalizado_idx" ON "Product"("codigoOriginalNormalizado");

-- AddForeignKey
ALTER TABLE "ProductImage" ADD CONSTRAINT "ProductImage_codigoOriginal_fkey" FOREIGN KEY ("codigoOriginal") REFERENCES "Product"("codigoOriginal") ON DELETE CASCADE ON UPDATE CASCADE;

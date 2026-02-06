/*
  Warnings:

  - You are about to drop the column `codigoOriginal` on the `ProductImage` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[codigoInterno]` on the table `Product` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "ProductImage" DROP CONSTRAINT "ProductImage_codigoOriginal_fkey";

-- DropIndex
DROP INDEX "Product_codigoOriginal_key";

-- DropIndex
DROP INDEX "ProductImage_codigoOriginal_idx";

-- AlterTable
ALTER TABLE "Product" ALTER COLUMN "codigoOriginal" DROP NOT NULL;

-- AlterTable
ALTER TABLE "ProductImage" DROP COLUMN "codigoOriginal",
ADD COLUMN     "productId" TEXT;

-- CreateTable
CREATE TABLE "Banner" (
    "id" SERIAL NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "publicId" TEXT NOT NULL,
    "title" TEXT,
    "subtitle" TEXT,
    "link" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Banner_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Product_codigoInterno_key" ON "Product"("codigoInterno");

-- CreateIndex
CREATE INDEX "ProductImage_productId_idx" ON "ProductImage"("productId");

-- AddForeignKey
ALTER TABLE "ProductImage" ADD CONSTRAINT "ProductImage_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

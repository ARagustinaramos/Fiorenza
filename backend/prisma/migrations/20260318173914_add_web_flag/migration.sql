-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "web" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "Product_web_idx" ON "Product"("web");

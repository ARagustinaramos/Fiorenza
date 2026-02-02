-- DropIndex
DROP INDEX "Product_codigoOriginalNormalizado_idx";

-- CreateIndex
CREATE INDEX "Product_codigoInterno_idx" ON "Product"("codigoInterno");

-- CreateIndex
CREATE INDEX "Product_descripcion_idx" ON "Product"("descripcion");

-- CreateIndex
CREATE INDEX "Product_marcaId_idx" ON "Product"("marcaId");

-- CreateIndex
CREATE INDEX "Product_familiaId_idx" ON "Product"("familiaId");

-- CreateIndex
CREATE INDEX "Product_rubro_idx" ON "Product"("rubro");

-- CreateIndex
CREATE INDEX "Product_activo_idx" ON "Product"("activo");

-- CreateIndex
CREATE INDEX "Product_precioConIva_idx" ON "Product"("precioConIva");

-- CreateIndex
CREATE INDEX "Product_marcaId_familiaId_idx" ON "Product"("marcaId", "familiaId");

-- CreateIndex
CREATE INDEX "Product_activo_precioConIva_idx" ON "Product"("activo", "precioConIva");

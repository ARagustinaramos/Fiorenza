-- CreateTable
CREATE TABLE "Brand" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Brand_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Family" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Family_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "codigoInterno" TEXT NOT NULL,
    "codigoOriginal" INTEGER NOT NULL,
    "descripcion" TEXT NOT NULL,
    "descripcionAdicional" TEXT,
    "precioConIva" DOUBLE PRECISION NOT NULL,
    "precioMayoristaSinIva" DOUBLE PRECISION NOT NULL,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "marcaId" TEXT NOT NULL,
    "familiaId" TEXT NOT NULL,
    "rubro" TEXT,
    "imagenes" TEXT[],
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Brand_nombre_idx" ON "Brand"("nombre");

-- CreateIndex
CREATE INDEX "Family_nombre_idx" ON "Family"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "Product_codigoOriginal_key" ON "Product"("codigoOriginal");

-- CreateIndex
CREATE INDEX "Product_marcaId_idx" ON "Product"("marcaId");

-- CreateIndex
CREATE INDEX "Product_familiaId_idx" ON "Product"("familiaId");

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_marcaId_fkey" FOREIGN KEY ("marcaId") REFERENCES "Brand"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_familiaId_fkey" FOREIGN KEY ("familiaId") REFERENCES "Family"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "PerfilMinorista"
ADD COLUMN     "ciudad" TEXT,
ADD COLUMN     "codigoPostal" TEXT,
ADD COLUMN     "provincia" TEXT,
ADD COLUMN     "referencia" TEXT;

ALTER TABLE "Order"
ADD COLUMN     "shippingMethod" TEXT,
ADD COLUMN     "shippingZone" TEXT,
ADD COLUMN     "shippingBoxSize" TEXT,
ADD COLUMN     "shippingEstimatedCost" DECIMAL(10,2),
ADD COLUMN     "shippingFullName" TEXT,
ADD COLUMN     "shippingPhone" TEXT,
ADD COLUMN     "shippingAddress" TEXT,
ADD COLUMN     "shippingCity" TEXT,
ADD COLUMN     "shippingProvince" TEXT,
ADD COLUMN     "shippingPostalCode" TEXT,
ADD COLUMN     "shippingReference" TEXT;

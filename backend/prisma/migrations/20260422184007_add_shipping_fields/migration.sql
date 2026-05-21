-- CreateTable
CREATE TABLE "MercadoPagoSession" (
    "id" TEXT NOT NULL,
    "preferenceId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "cartSnapshot" JSONB,
    "userId" TEXT NOT NULL,
    "orderId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MercadoPagoSession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MercadoPagoSession_preferenceId_key" ON "MercadoPagoSession"("preferenceId");

-- CreateIndex
CREATE INDEX "MercadoPagoSession_userId_idx" ON "MercadoPagoSession"("userId");

-- CreateIndex
CREATE INDEX "MercadoPagoSession_orderId_idx" ON "MercadoPagoSession"("orderId");

-- CreateIndex
CREATE INDEX "MercadoPagoSession_status_idx" ON "MercadoPagoSession"("status");

-- AddForeignKey
ALTER TABLE "MercadoPagoSession" ADD CONSTRAINT "MercadoPagoSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MercadoPagoSession" ADD CONSTRAINT "MercadoPagoSession_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;

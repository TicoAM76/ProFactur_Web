-- CreateTable
CREATE TABLE "vehicles" (
    "id" UUID NOT NULL,
    "companyId" UUID NOT NULL,
    "customerId" UUID NOT NULL,
    "registrationNumber" TEXT NOT NULL,
    "brand" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "version" TEXT,
    "vin" TEXT,
    "currentMileage" INTEGER,
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vehicles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "vehicles_companyId_registrationNumber_key"
ON "vehicles"("companyId", "registrationNumber");

-- CreateIndex
CREATE UNIQUE INDEX "vehicles_companyId_vin_key"
ON "vehicles"("companyId", "vin");

-- CreateIndex
CREATE INDEX "vehicles_companyId_idx"
ON "vehicles"("companyId");

-- CreateIndex
CREATE INDEX "vehicles_customerId_idx"
ON "vehicles"("customerId");

-- AddForeignKey
ALTER TABLE "vehicles"
ADD CONSTRAINT "vehicles_companyId_fkey"
FOREIGN KEY ("companyId")
REFERENCES "companies"("id")
ON DELETE RESTRICT
ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicles"
ADD CONSTRAINT "vehicles_customerId_fkey"
FOREIGN KEY ("customerId")
REFERENCES "customers"("id")
ON DELETE RESTRICT
ON UPDATE CASCADE;

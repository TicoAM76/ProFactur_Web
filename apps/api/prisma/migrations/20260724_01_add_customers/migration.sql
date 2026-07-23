-- CreateEnum
CREATE TYPE "CustomerType" AS ENUM ('PERSON', 'COMPANY');

-- CreateTable
CREATE TABLE "customers" (
    "id" UUID NOT NULL,
    "companyId" UUID NOT NULL,
    "type" "CustomerType" NOT NULL DEFAULT 'PERSON',
    "legalName" TEXT NOT NULL,
    "tradeName" TEXT,
    "taxId" TEXT,
    "addressLine1" TEXT,
    "addressLine2" TEXT,
    "postalCode" TEXT,
    "city" TEXT,
    "province" TEXT,
    "countryCode" CHAR(2) NOT NULL DEFAULT 'ES',
    "phone" TEXT,
    "email" TEXT,
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "customers_companyId_taxId_key"
ON "customers"("companyId", "taxId");

-- CreateIndex
CREATE INDEX "customers_companyId_idx"
ON "customers"("companyId");

-- CreateIndex
CREATE INDEX "customers_companyId_legalName_idx"
ON "customers"("companyId", "legalName");

-- AddForeignKey
ALTER TABLE "customers"
ADD CONSTRAINT "customers_companyId_fkey"
FOREIGN KEY ("companyId")
REFERENCES "companies"("id")
ON DELETE RESTRICT
ON UPDATE CASCADE;

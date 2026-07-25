-- AlterEnum
ALTER TYPE "InvoiceDraftStatus"
ADD VALUE IF NOT EXISTS 'CONVERTED';

-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('ISSUED', 'RECTIFIED', 'CANCELLED');

-- AlterTable
ALTER TABLE "invoice_drafts"
ADD COLUMN "convertedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "invoice_series" (
    "id" UUID NOT NULL,
    "companyId" UUID NOT NULL,
    "code" VARCHAR(20) NOT NULL,
    "year" INTEGER NOT NULL,
    "nextNumber" INTEGER NOT NULL DEFAULT 1,
    "padding" INTEGER NOT NULL DEFAULT 6,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "invoice_series_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoices" (
    "id" UUID NOT NULL,
    "companyId" UUID NOT NULL,
    "seriesId" UUID NOT NULL,
    "sourceDraftId" UUID NOT NULL,
    "customerId" UUID NOT NULL,
    "vehicleId" UUID,
    "status" "InvoiceStatus" NOT NULL DEFAULT 'ISSUED',
    "number" INTEGER NOT NULL,
    "fullNumber" VARCHAR(50) NOT NULL,
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dueAt" TIMESTAMP(3),
    "currencyCode" CHAR(3) NOT NULL DEFAULT 'EUR',
    "notes" TEXT,
    "sellerLegalName" VARCHAR(200) NOT NULL,
    "sellerTradeName" VARCHAR(200),
    "sellerTaxId" VARCHAR(20) NOT NULL,
    "sellerAddressLine1" VARCHAR(250) NOT NULL,
    "sellerAddressLine2" VARCHAR(250),
    "sellerPostalCode" VARCHAR(10) NOT NULL,
    "sellerCity" VARCHAR(100) NOT NULL,
    "sellerProvince" VARCHAR(100) NOT NULL,
    "sellerCountryCode" CHAR(2) NOT NULL,
    "customerLegalName" VARCHAR(200) NOT NULL,
    "customerTradeName" VARCHAR(200),
    "customerTaxId" VARCHAR(20),
    "customerAddressLine1" VARCHAR(250),
    "customerAddressLine2" VARCHAR(250),
    "customerPostalCode" VARCHAR(10),
    "customerCity" VARCHAR(100),
    "customerProvince" VARCHAR(100),
    "customerCountryCode" CHAR(2) NOT NULL,
    "vehicleRegistrationNumber" VARCHAR(20),
    "vehicleBrand" VARCHAR(100),
    "vehicleModel" VARCHAR(100),
    "vehicleVersion" VARCHAR(100),
    "vehicleVin" VARCHAR(50),
    "vehicleMileage" INTEGER,
    "subtotal" DECIMAL(14,2) NOT NULL,
    "taxAmount" DECIMAL(14,2) NOT NULL,
    "totalAmount" DECIMAL(14,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoice_lines" (
    "id" UUID NOT NULL,
    "invoiceId" UUID NOT NULL,
    "catalogItemId" UUID,
    "position" INTEGER NOT NULL,
    "type" "CatalogItemType" NOT NULL,
    "code" VARCHAR(50),
    "description" VARCHAR(500) NOT NULL,
    "quantity" DECIMAL(12,3) NOT NULL,
    "unit" VARCHAR(20) NOT NULL,
    "unitPrice" DECIMAL(12,2) NOT NULL,
    "discountRate" DECIMAL(5,2) NOT NULL,
    "taxRate" DECIMAL(5,2) NOT NULL,
    "netAmount" DECIMAL(14,2) NOT NULL,
    "taxAmount" DECIMAL(14,2) NOT NULL,
    "totalAmount" DECIMAL(14,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "invoice_lines_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "invoice_series_companyId_code_year_key"
ON "invoice_series"("companyId", "code", "year");

-- CreateIndex
CREATE INDEX "invoice_series_companyId_isActive_idx"
ON "invoice_series"("companyId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "invoices_sourceDraftId_key"
ON "invoices"("sourceDraftId");

-- CreateIndex
CREATE UNIQUE INDEX "invoices_seriesId_number_key"
ON "invoices"("seriesId", "number");

-- CreateIndex
CREATE UNIQUE INDEX "invoices_companyId_fullNumber_key"
ON "invoices"("companyId", "fullNumber");

-- CreateIndex
CREATE INDEX "invoices_companyId_issuedAt_idx"
ON "invoices"("companyId", "issuedAt");

-- CreateIndex
CREATE INDEX "invoices_customerId_idx"
ON "invoices"("customerId");

-- CreateIndex
CREATE INDEX "invoices_vehicleId_idx"
ON "invoices"("vehicleId");

-- CreateIndex
CREATE UNIQUE INDEX "invoice_lines_invoiceId_position_key"
ON "invoice_lines"("invoiceId", "position");

-- CreateIndex
CREATE INDEX "invoice_lines_catalogItemId_idx"
ON "invoice_lines"("catalogItemId");

-- AddForeignKey
ALTER TABLE "invoice_series"
ADD CONSTRAINT "invoice_series_companyId_fkey"
FOREIGN KEY ("companyId")
REFERENCES "companies"("id")
ON DELETE RESTRICT
ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices"
ADD CONSTRAINT "invoices_companyId_fkey"
FOREIGN KEY ("companyId")
REFERENCES "companies"("id")
ON DELETE RESTRICT
ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices"
ADD CONSTRAINT "invoices_seriesId_fkey"
FOREIGN KEY ("seriesId")
REFERENCES "invoice_series"("id")
ON DELETE RESTRICT
ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices"
ADD CONSTRAINT "invoices_sourceDraftId_fkey"
FOREIGN KEY ("sourceDraftId")
REFERENCES "invoice_drafts"("id")
ON DELETE RESTRICT
ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices"
ADD CONSTRAINT "invoices_customerId_fkey"
FOREIGN KEY ("customerId")
REFERENCES "customers"("id")
ON DELETE RESTRICT
ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices"
ADD CONSTRAINT "invoices_vehicleId_fkey"
FOREIGN KEY ("vehicleId")
REFERENCES "vehicles"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice_lines"
ADD CONSTRAINT "invoice_lines_invoiceId_fkey"
FOREIGN KEY ("invoiceId")
REFERENCES "invoices"("id")
ON DELETE RESTRICT
ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice_lines"
ADD CONSTRAINT "invoice_lines_catalogItemId_fkey"
FOREIGN KEY ("catalogItemId")
REFERENCES "catalog_items"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;

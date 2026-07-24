-- CreateEnum
CREATE TYPE "InvoiceDraftStatus" AS ENUM ('DRAFT', 'READY');

-- CreateTable
CREATE TABLE "invoice_drafts" (
    "id" UUID NOT NULL,
    "companyId" UUID NOT NULL,
    "customerId" UUID NOT NULL,
    "vehicleId" UUID,
    "status" "InvoiceDraftStatus" NOT NULL DEFAULT 'DRAFT',
    "currencyCode" CHAR(3) NOT NULL DEFAULT 'EUR',
    "notes" TEXT,
    "subtotal" DECIMAL(14,2) NOT NULL DEFAULT 0.00,
    "taxAmount" DECIMAL(14,2) NOT NULL DEFAULT 0.00,
    "totalAmount" DECIMAL(14,2) NOT NULL DEFAULT 0.00,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "invoice_drafts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoice_draft_lines" (
    "id" UUID NOT NULL,
    "invoiceDraftId" UUID NOT NULL,
    "catalogItemId" UUID,
    "position" INTEGER NOT NULL,
    "type" "CatalogItemType" NOT NULL,
    "code" VARCHAR(50),
    "description" VARCHAR(500) NOT NULL,
    "quantity" DECIMAL(12,3) NOT NULL,
    "unit" VARCHAR(20) NOT NULL,
    "unitPrice" DECIMAL(12,2) NOT NULL,
    "discountRate" DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    "taxRate" DECIMAL(5,2) NOT NULL,
    "netAmount" DECIMAL(14,2) NOT NULL,
    "taxAmount" DECIMAL(14,2) NOT NULL,
    "totalAmount" DECIMAL(14,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "invoice_draft_lines_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "invoice_drafts_companyId_status_idx"
ON "invoice_drafts"("companyId", "status");

-- CreateIndex
CREATE INDEX "invoice_drafts_customerId_idx"
ON "invoice_drafts"("customerId");

-- CreateIndex
CREATE INDEX "invoice_drafts_vehicleId_idx"
ON "invoice_drafts"("vehicleId");

-- CreateIndex
CREATE UNIQUE INDEX "invoice_draft_lines_invoiceDraftId_position_key"
ON "invoice_draft_lines"("invoiceDraftId", "position");

-- CreateIndex
CREATE INDEX "invoice_draft_lines_catalogItemId_idx"
ON "invoice_draft_lines"("catalogItemId");

-- AddForeignKey
ALTER TABLE "invoice_drafts"
ADD CONSTRAINT "invoice_drafts_companyId_fkey"
FOREIGN KEY ("companyId")
REFERENCES "companies"("id")
ON DELETE RESTRICT
ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice_drafts"
ADD CONSTRAINT "invoice_drafts_customerId_fkey"
FOREIGN KEY ("customerId")
REFERENCES "customers"("id")
ON DELETE RESTRICT
ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice_drafts"
ADD CONSTRAINT "invoice_drafts_vehicleId_fkey"
FOREIGN KEY ("vehicleId")
REFERENCES "vehicles"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice_draft_lines"
ADD CONSTRAINT "invoice_draft_lines_invoiceDraftId_fkey"
FOREIGN KEY ("invoiceDraftId")
REFERENCES "invoice_drafts"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice_draft_lines"
ADD CONSTRAINT "invoice_draft_lines_catalogItemId_fkey"
FOREIGN KEY ("catalogItemId")
REFERENCES "catalog_items"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;

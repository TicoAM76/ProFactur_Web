-- CreateEnum
CREATE TYPE "CatalogItemType" AS ENUM ('PRODUCT', 'SERVICE', 'LABOR');

-- CreateTable
CREATE TABLE "catalog_items" (
    "id" UUID NOT NULL,
    "companyId" UUID NOT NULL,
    "type" "CatalogItemType" NOT NULL,
    "code" VARCHAR(50),
    "name" VARCHAR(200) NOT NULL,
    "description" TEXT,
    "unit" VARCHAR(20) NOT NULL DEFAULT 'UD',
    "unitPrice" DECIMAL(12,2) NOT NULL,
    "taxRate" DECIMAL(5,2) NOT NULL DEFAULT 21.00,
    "trackInventory" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "catalog_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "catalog_items_companyId_code_key"
ON "catalog_items"("companyId", "code");

-- CreateIndex
CREATE INDEX "catalog_items_companyId_idx"
ON "catalog_items"("companyId");

-- CreateIndex
CREATE INDEX "catalog_items_companyId_type_idx"
ON "catalog_items"("companyId", "type");

-- CreateIndex
CREATE INDEX "catalog_items_companyId_name_idx"
ON "catalog_items"("companyId", "name");

-- AddForeignKey
ALTER TABLE "catalog_items"
ADD CONSTRAINT "catalog_items_companyId_fkey"
FOREIGN KEY ("companyId")
REFERENCES "companies"("id")
ON DELETE RESTRICT
ON UPDATE CASCADE;

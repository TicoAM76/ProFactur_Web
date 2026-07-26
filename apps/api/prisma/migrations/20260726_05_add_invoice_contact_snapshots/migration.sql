-- AlterTable
ALTER TABLE "invoices"
ADD COLUMN "sellerPhone" VARCHAR(30),
ADD COLUMN "sellerEmail" VARCHAR(254),
ADD COLUMN "sellerWebsite" VARCHAR(255),
ADD COLUMN "customerPhone" VARCHAR(30),
ADD COLUMN "customerEmail" VARCHAR(254);
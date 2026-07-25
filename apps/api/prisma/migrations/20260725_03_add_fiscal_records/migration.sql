-- CreateEnum
CREATE TYPE "FiscalEnvironment" AS ENUM (
    'TEST',
    'PRODUCTION'
);

-- CreateEnum
CREATE TYPE "FiscalRecordKind" AS ENUM (
    'ALTA',
    'ANULACION'
);

-- CreateEnum
CREATE TYPE "FiscalRecordState" AS ENUM (
    'GENERATED',
    'PENDING_SUBMISSION',
    'SUBMITTED',
    'ACCEPTED',
    'ACCEPTED_WITH_ERRORS',
    'REJECTED'
);

-- CreateEnum
CREATE TYPE "FiscalInvoiceType" AS ENUM (
    'F1',
    'F2',
    'F3',
    'R1',
    'R2',
    'R3',
    'R4',
    'R5'
);

-- CreateTable
CREATE TABLE "fiscal_chains" (
    "id" UUID NOT NULL,
    "companyId" UUID NOT NULL,
    "environment" "FiscalEnvironment" NOT NULL,
    "installationNumber" VARCHAR(50) NOT NULL DEFAULT '1',
    "nextSequence" INTEGER NOT NULL DEFAULT 1,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fiscal_chains_pkey"
    PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fiscal_records" (
    "id" UUID NOT NULL,
    "chainId" UUID NOT NULL,
    "companyId" UUID NOT NULL,
    "invoiceId" UUID NOT NULL,
    "sequence" INTEGER NOT NULL,
    "kind" "FiscalRecordKind" NOT NULL,
    "state" "FiscalRecordState" NOT NULL DEFAULT 'GENERATED',
    "invoiceType" "FiscalInvoiceType" NOT NULL,

    "issuerTaxId" VARCHAR(20) NOT NULL,
    "invoiceNumber" VARCHAR(60) NOT NULL,
    "invoiceDate" CHAR(10) NOT NULL,

    "totalTaxAmount" DECIMAL(14,2) NOT NULL,
    "totalAmount" DECIMAL(14,2) NOT NULL,

    "previousRecordId" UUID,
    "previousInvoiceNumber" VARCHAR(60),
    "previousInvoiceDate" CHAR(10),
    "previousHash" CHAR(64),

    "hashInput" TEXT NOT NULL,
    "hash" CHAR(64) NOT NULL,

    "generatedAt" TIMESTAMP(3) NOT NULL,
    "generatedAtWithOffset" VARCHAR(35) NOT NULL,

    "qrUrl" TEXT,

    "aeatCsv" VARCHAR(100),
    "aeatStatusCode" VARCHAR(50),
    "aeatErrorCode" VARCHAR(50),
    "aeatErrorDescription" TEXT,

    "submittedAt" TIMESTAMP(3),
    "acceptedAt" TIMESTAMP(3),

    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fiscal_records_pkey"
    PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX
"fiscal_chains_companyId_environment_installationNumber_key"
ON "fiscal_chains"(
    "companyId",
    "environment",
    "installationNumber"
);

-- CreateIndex
CREATE INDEX
"fiscal_chains_companyId_environment_isActive_idx"
ON "fiscal_chains"(
    "companyId",
    "environment",
    "isActive"
);

-- CreateIndex
CREATE UNIQUE INDEX
"fiscal_records_previousRecordId_key"
ON "fiscal_records"("previousRecordId");

-- CreateIndex
CREATE UNIQUE INDEX
"fiscal_records_chainId_sequence_key"
ON "fiscal_records"(
    "chainId",
    "sequence"
);

-- CreateIndex
CREATE UNIQUE INDEX
"fiscal_records_chainId_hash_key"
ON "fiscal_records"(
    "chainId",
    "hash"
);

-- CreateIndex
CREATE INDEX
"fiscal_records_companyId_state_idx"
ON "fiscal_records"(
    "companyId",
    "state"
);

-- CreateIndex
CREATE INDEX
"fiscal_records_invoiceId_kind_idx"
ON "fiscal_records"(
    "invoiceId",
    "kind"
);

-- CreateIndex
CREATE INDEX
"fiscal_records_chainId_createdAt_idx"
ON "fiscal_records"(
    "chainId",
    "createdAt"
);

-- AddForeignKey
ALTER TABLE "fiscal_chains"
ADD CONSTRAINT "fiscal_chains_companyId_fkey"
FOREIGN KEY ("companyId")
REFERENCES "companies"("id")
ON DELETE RESTRICT
ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fiscal_records"
ADD CONSTRAINT "fiscal_records_chainId_fkey"
FOREIGN KEY ("chainId")
REFERENCES "fiscal_chains"("id")
ON DELETE RESTRICT
ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fiscal_records"
ADD CONSTRAINT "fiscal_records_companyId_fkey"
FOREIGN KEY ("companyId")
REFERENCES "companies"("id")
ON DELETE RESTRICT
ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fiscal_records"
ADD CONSTRAINT "fiscal_records_invoiceId_fkey"
FOREIGN KEY ("invoiceId")
REFERENCES "invoices"("id")
ON DELETE RESTRICT
ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fiscal_records"
ADD CONSTRAINT "fiscal_records_previousRecordId_fkey"
FOREIGN KEY ("previousRecordId")
REFERENCES "fiscal_records"("id")
ON DELETE RESTRICT
ON UPDATE CASCADE;
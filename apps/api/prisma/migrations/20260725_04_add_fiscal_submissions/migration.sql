-- CreateEnum
CREATE TYPE "FiscalSubmissionState" AS ENUM (
    'CREATED',
    'SENDING',
    'RESPONSE_RECEIVED',
    'COMPLETED',
    'TRANSPORT_ERROR',
    'SOAP_FAULT'
);

-- CreateTable
CREATE TABLE "fiscal_submissions" (
    "id" UUID NOT NULL,
    "companyId" UUID NOT NULL,
    "chainId" UUID NOT NULL,
    "environment" "FiscalEnvironment" NOT NULL,
    "installationNumber" VARCHAR(100) NOT NULL,
    "state" "FiscalSubmissionState" NOT NULL DEFAULT 'CREATED',

    "endpoint" VARCHAR(500) NOT NULL,
    "requestXml" TEXT NOT NULL,
    "requestHash" CHAR(64) NOT NULL,

    "responseXml" TEXT,
    "httpStatus" INTEGER,

    "globalStatus" VARCHAR(50),
    "aeatCsv" VARCHAR(100),

    "presenterTaxId" VARCHAR(20),
    "presentationAt" TIMESTAMP(3),
    "presentationRaw" VARCHAR(35),
    "waitSeconds" INTEGER,

    "soapFaultCode" VARCHAR(100),
    "soapFaultMessage" TEXT,
    "transportError" TEXT,

    "certificateFingerprint" VARCHAR(128),

    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "durationMs" INTEGER,
    "nextRetryAt" TIMESTAMP(3),

    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fiscal_submissions_pkey"
    PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fiscal_submission_items" (
    "id" UUID NOT NULL,
    "submissionId" UUID NOT NULL,
    "fiscalRecordId" UUID NOT NULL,

    "position" INTEGER NOT NULL,
    "attemptNumber" INTEGER NOT NULL,
    "operation" "FiscalRecordKind" NOT NULL,

    "resultState" "FiscalRecordState",

    "aeatStatusCode" VARCHAR(50),
    "aeatErrorCode" VARCHAR(50),
    "aeatErrorDescription" TEXT,

    "duplicateState" VARCHAR(50),
    "duplicateIssuerTaxId" VARCHAR(20),
    "duplicateInvoiceNumber" VARCHAR(60),
    "duplicateInvoiceDate" CHAR(10),

    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fiscal_submission_items_pkey"
    PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX
"fiscal_submissions_companyId_state_idx"
ON "fiscal_submissions"(
    "companyId",
    "state"
);

-- CreateIndex
CREATE INDEX
"fiscal_submissions_chainId_createdAt_idx"
ON "fiscal_submissions"(
    "chainId",
    "createdAt"
);

-- CreateIndex
CREATE INDEX
"fiscal_submissions_state_nextRetryAt_idx"
ON "fiscal_submissions"(
    "state",
    "nextRetryAt"
);

-- CreateIndex
CREATE UNIQUE INDEX
"fiscal_submission_items_submissionId_position_key"
ON "fiscal_submission_items"(
    "submissionId",
    "position"
);

-- CreateIndex
CREATE UNIQUE INDEX
"fiscal_submission_items_submissionId_fiscalRecordId_key"
ON "fiscal_submission_items"(
    "submissionId",
    "fiscalRecordId"
);

-- CreateIndex
CREATE UNIQUE INDEX
"fiscal_submission_items_fiscalRecordId_attemptNumber_key"
ON "fiscal_submission_items"(
    "fiscalRecordId",
    "attemptNumber"
);

-- CreateIndex
CREATE INDEX
"fiscal_submission_items_fiscalRecordId_createdAt_idx"
ON "fiscal_submission_items"(
    "fiscalRecordId",
    "createdAt"
);

-- AddForeignKey
ALTER TABLE "fiscal_submissions"
ADD CONSTRAINT "fiscal_submissions_companyId_fkey"
FOREIGN KEY ("companyId")
REFERENCES "companies"("id")
ON DELETE RESTRICT
ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fiscal_submissions"
ADD CONSTRAINT "fiscal_submissions_chainId_fkey"
FOREIGN KEY ("chainId")
REFERENCES "fiscal_chains"("id")
ON DELETE RESTRICT
ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fiscal_submission_items"
ADD CONSTRAINT "fiscal_submission_items_submissionId_fkey"
FOREIGN KEY ("submissionId")
REFERENCES "fiscal_submissions"("id")
ON DELETE RESTRICT
ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fiscal_submission_items"
ADD CONSTRAINT "fiscal_submission_items_fiscalRecordId_fkey"
FOREIGN KEY ("fiscalRecordId")
REFERENCES "fiscal_records"("id")
ON DELETE RESTRICT
ON UPDATE CASCADE;
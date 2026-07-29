-- CreateTable
CREATE TABLE "fiscal_bridge_dispatches" (
    "id" UUID NOT NULL,
    "companyId" UUID NOT NULL,
    "submissionId" UUID NOT NULL,
    "tokenHash" CHAR(64) NOT NULL,
    "requestHash" CHAR(64) NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "claimedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fiscal_bridge_dispatches_pkey"
        PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX
    "fiscal_bridge_dispatches_submissionId_key"
ON "fiscal_bridge_dispatches"("submissionId");

-- CreateIndex
CREATE UNIQUE INDEX
    "fiscal_bridge_dispatches_tokenHash_key"
ON "fiscal_bridge_dispatches"("tokenHash");

-- CreateIndex
CREATE INDEX
    "fiscal_bridge_dispatches_companyId_expiresAt_idx"
ON "fiscal_bridge_dispatches"("companyId", "expiresAt");

-- CreateIndex
CREATE INDEX
    "fiscal_bridge_dispatches_expiresAt_claimedAt_idx"
ON "fiscal_bridge_dispatches"("expiresAt", "claimedAt");

-- AddForeignKey
ALTER TABLE "fiscal_bridge_dispatches"
ADD CONSTRAINT "fiscal_bridge_dispatches_companyId_fkey"
FOREIGN KEY ("companyId")
REFERENCES "companies"("id")
ON DELETE RESTRICT
ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fiscal_bridge_dispatches"
ADD CONSTRAINT "fiscal_bridge_dispatches_submissionId_fkey"
FOREIGN KEY ("submissionId")
REFERENCES "fiscal_submissions"("id")
ON DELETE RESTRICT
ON UPDATE CASCADE;

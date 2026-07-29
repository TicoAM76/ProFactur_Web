-- AlterTable
ALTER TABLE "fiscal_bridge_dispatches"
ADD COLUMN "executionTokenHash" CHAR(64),
ADD COLUMN "executionExpiresAt" TIMESTAMP(3),
ADD COLUMN "completedAt" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX
    "fiscal_bridge_dispatches_executionTokenHash_key"
ON "fiscal_bridge_dispatches"("executionTokenHash");

-- CreateIndex
CREATE INDEX
    "fiscal_bridge_dispatches_executionExpiresAt_completedAt_idx"
ON "fiscal_bridge_dispatches"("executionExpiresAt", "completedAt");

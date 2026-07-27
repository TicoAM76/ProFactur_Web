-- CreateTable
CREATE TABLE "demo_document_series" (
    "id" UUID NOT NULL,
    "companyId" UUID NOT NULL,
    "code" VARCHAR(20) NOT NULL DEFAULT 'DEMO',
    "year" INTEGER NOT NULL,
    "nextNumber" INTEGER NOT NULL DEFAULT 1,
    "padding" INTEGER NOT NULL DEFAULT 6,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "demo_document_series_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "demo_documents" (
    "id" UUID NOT NULL,
    "companyId" UUID NOT NULL,
    "seriesId" UUID NOT NULL,
    "sourceDraftId" UUID NOT NULL,
    "number" INTEGER NOT NULL,
    "fullNumber" VARCHAR(50) NOT NULL,
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "currencyCode" CHAR(3) NOT NULL DEFAULT 'EUR',
    "snapshot" JSONB NOT NULL,
    "qrToken" VARCHAR(64) NOT NULL,
    "qrUrl" VARCHAR(500) NOT NULL,
    "fiscalHashInput" TEXT NOT NULL,
    "fiscalHash" CHAR(64) NOT NULL,
    "generatedAtWithOffset" VARCHAR(35) NOT NULL,
    "xmlPreview" TEXT NOT NULL,
    "xmlHash" CHAR(64) NOT NULL,
    "pdfHash" CHAR(64),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "demo_documents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "demo_document_series_companyId_idx"
ON "demo_document_series"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "demo_document_series_companyId_code_year_key"
ON "demo_document_series"("companyId", "code", "year");

-- CreateIndex
CREATE UNIQUE INDEX "demo_documents_sourceDraftId_key"
ON "demo_documents"("sourceDraftId");

-- CreateIndex
CREATE UNIQUE INDEX "demo_documents_qrToken_key"
ON "demo_documents"("qrToken");

-- CreateIndex
CREATE INDEX "demo_documents_companyId_issuedAt_idx"
ON "demo_documents"("companyId", "issuedAt");

-- CreateIndex
CREATE UNIQUE INDEX "demo_documents_seriesId_number_key"
ON "demo_documents"("seriesId", "number");

-- CreateIndex
CREATE UNIQUE INDEX "demo_documents_companyId_fullNumber_key"
ON "demo_documents"("companyId", "fullNumber");

-- AddForeignKey
ALTER TABLE "demo_document_series"
ADD CONSTRAINT "demo_document_series_companyId_fkey"
FOREIGN KEY ("companyId") REFERENCES "companies"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demo_documents"
ADD CONSTRAINT "demo_documents_companyId_fkey"
FOREIGN KEY ("companyId") REFERENCES "companies"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demo_documents"
ADD CONSTRAINT "demo_documents_seriesId_fkey"
FOREIGN KEY ("seriesId") REFERENCES "demo_document_series"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demo_documents"
ADD CONSTRAINT "demo_documents_sourceDraftId_fkey"
FOREIGN KEY ("sourceDraftId") REFERENCES "invoice_drafts"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

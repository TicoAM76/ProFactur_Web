import 'reflect-metadata';

import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { createHash } from 'node:crypto';
import {
  CatalogItemType,
  CustomerType,
  FiscalEnvironment,
  FiscalRecordKind,
  FiscalRecordState,
  FiscalSubmissionState,
  InvoiceDraftStatus,
  Prisma,
} from '../src/generated/prisma/client';
import { BridgeDispatchService } from '../src/fiscal/bridge/bridge-dispatch.service';
import { hashBridgeDispatchToken } from '../src/fiscal/bridge/bridge-dispatch-token';
import { FiscalRecordsService } from '../src/fiscal/fiscal-records.service';
import { FiscalSubmissionsService } from '../src/fiscal/fiscal-submissions.service';
import { FiscalXmlService } from '../src/fiscal/fiscal-xml.service';
import { InvoicesService } from '../src/invoices/invoices.service';
import { PrismaService } from '../src/prisma/prisma.service';

const TEST_COMPANY_TAX_ID = 'B87654321';
const TEST_CUSTOMER_TAX_ID = '87654321X';

describe('Preparación fiscal VERI*FACTU con PostgreSQL real', () => {
  let prisma: PrismaService;
  let invoicesService: InvoicesService;
  let fiscalSubmissionsService: FiscalSubmissionsService;
  let bridgeDispatchService: BridgeDispatchService;

  async function deleteOnlyIntegrationTestData(): Promise<void> {
    const company = await prisma.company.findUnique({
      where: {
        taxId: TEST_COMPANY_TAX_ID,
      },
      select: {
        id: true,
      },
    });

    if (!company) {
      return;
    }

    await prisma.$transaction(async (transaction) => {
      const submissions = await transaction.fiscalSubmission.findMany({
        where: {
          companyId: company.id,
        },
        select: {
          id: true,
        },
      });

      const invoices = await transaction.invoice.findMany({
        where: {
          companyId: company.id,
        },
        select: {
          id: true,
        },
      });

      const drafts = await transaction.invoiceDraft.findMany({
        where: {
          companyId: company.id,
        },
        select: {
          id: true,
        },
      });

      const submissionIds = submissions.map((submission) => submission.id);
      const invoiceIds = invoices.map((invoice) => invoice.id);
      const draftIds = drafts.map((draft) => draft.id);

      await transaction.fiscalBridgeDispatch.deleteMany({
        where: {
          companyId: company.id,
        },
      });

      await transaction.fiscalSubmissionItem.deleteMany({
        where: {
          submissionId: {
            in: submissionIds,
          },
        },
      });

      await transaction.fiscalSubmission.deleteMany({
        where: {
          companyId: company.id,
        },
      });

      await transaction.fiscalRecord.deleteMany({
        where: {
          companyId: company.id,
        },
      });

      await transaction.fiscalChain.deleteMany({
        where: {
          companyId: company.id,
        },
      });

      await transaction.invoiceLine.deleteMany({
        where: {
          invoiceId: {
            in: invoiceIds,
          },
        },
      });

      await transaction.invoice.deleteMany({
        where: {
          companyId: company.id,
        },
      });

      await transaction.invoiceSeries.deleteMany({
        where: {
          companyId: company.id,
        },
      });

      await transaction.invoiceDraftLine.deleteMany({
        where: {
          invoiceDraftId: {
            in: draftIds,
          },
        },
      });

      await transaction.invoiceDraft.deleteMany({
        where: {
          companyId: company.id,
        },
      });

      await transaction.customer.deleteMany({
        where: {
          companyId: company.id,
        },
      });

      await transaction.company.delete({
        where: {
          id: company.id,
        },
      });
    });
  }

  beforeAll(async () => {
    process.env.VERIFACTU_ENVIRONMENT = FiscalEnvironment.TEST;
    process.env.VERIFACTU_INSTALLATION_NUMBER = 'RNBRIDGE-INTEGRATION-1';
    process.env.VERIFACTU_SIF_PRODUCER_NAME = 'FacturTaller Integración';
    process.env.VERIFACTU_SIF_PRODUCER_TAX_ID = 'B12345678';
    process.env.VERIFACTU_SIF_NAME = 'FacturTaller';
    process.env.VERIFACTU_SIF_ID = 'FT';
    process.env.VERIFACTU_SIF_VERSION = '0.1.0';
    process.env.VERIFACTU_SIF_ONLY_VERIFACTU = 'S';
    process.env.VERIFACTU_SIF_SUPPORTS_MULTIPLE_TAXPAYERS = 'S';
    process.env.VERIFACTU_SIF_CURRENT_MULTIPLE_TAXPAYERS = 'N';

    delete process.env.VERIFACTU_SOAP_ENDPOINT;

    prisma = new PrismaService();
    await prisma.$connect();

    await deleteOnlyIntegrationTestData();

    const fiscalRecordsService = new FiscalRecordsService();

    invoicesService = new InvoicesService(prisma, fiscalRecordsService);

    fiscalSubmissionsService = new FiscalSubmissionsService(
      prisma,
      new FiscalXmlService(prisma),
    );

    bridgeDispatchService = new BridgeDispatchService(prisma);
  });

  afterAll(async () => {
    if (prisma) {
      await deleteOnlyIntegrationTestData();
      await prisma.$disconnect();
    }
  });

  it('emite una factura y prepara un único envío CREATED sin certificado ni transporte', async () => {
    const company = await prisma.company.create({
      data: {
        legalName: 'Taller Integración RN Bridge SL',
        tradeName: 'RNBRIDGE-INTEGRATION-TEST',
        taxId: TEST_COMPANY_TAX_ID,
        addressLine1: 'Calle Integración 1',
        postalCode: '46980',
        city: 'Paterna',
        province: 'Valencia',
        countryCode: 'ES',
        email: 'integration@example.test',
      },
    });

    const customer = await prisma.customer.create({
      data: {
        companyId: company.id,
        type: CustomerType.PERSON,
        legalName: 'Cliente Integración Fiscal',
        taxId: TEST_CUSTOMER_TAX_ID,
        addressLine1: 'Avenida Integración 10',
        postalCode: '46001',
        city: 'Valencia',
        province: 'Valencia',
        countryCode: 'ES',
      },
    });

    const draft = await prisma.invoiceDraft.create({
      data: {
        companyId: company.id,
        customerId: customer.id,
        status: InvoiceDraftStatus.READY,
        readyAt: new Date(),
        currencyCode: 'EUR',
        notes: 'Revisión mecánica de integración',
        subtotal: new Prisma.Decimal('100.00'),
        taxAmount: new Prisma.Decimal('21.00'),
        totalAmount: new Prisma.Decimal('121.00'),
        lines: {
          create: {
            position: 1,
            type: CatalogItemType.SERVICE,
            code: 'INT-001',
            description: 'Revisión mecánica de integración',
            quantity: new Prisma.Decimal('1.000'),
            unit: 'UD',
            unitPrice: new Prisma.Decimal('100.00'),
            discountRate: new Prisma.Decimal('0.00'),
            taxRate: new Prisma.Decimal('21.00'),
            netAmount: new Prisma.Decimal('100.00'),
            taxAmount: new Prisma.Decimal('21.00'),
            totalAmount: new Prisma.Decimal('121.00'),
          },
        },
      },
    });

    const invoice = await invoicesService.issueFromDraft(company.id, draft.id, {
      seriesCode: 'F',
    });

    expect(invoice.fullNumber).toMatch(/^F-\d{4}-000001$/);
    expect(invoice.fiscalRecord.state).toBe(
      FiscalRecordState.PENDING_SUBMISSION,
    );
    expect(invoice.fiscalRecord.kind).toBe(FiscalRecordKind.ALTA);
    expect(invoice.fiscalRecord.sequence).toBe(1);

    const submission = await fiscalSubmissionsService.prepare(
      company.id,
      invoice.fiscalRecord.id,
    );

    const recomputedRequestHash = createHash('sha256')
      .update(submission.requestXml, 'utf8')
      .digest('hex')
      .toUpperCase();

    expect(submission.state).toBe(FiscalSubmissionState.CREATED);
    expect(submission.environment).toBe(FiscalEnvironment.TEST);
    expect(submission.installationNumber).toBe('RNBRIDGE-INTEGRATION-1');
    expect(submission.endpoint).toBe(
      'https://prewww1.aeat.es/wlpl/TIKE-CONT/ws/SistemaFacturacion/VerifactuSOAP',
    );
    expect(submission.requestXml.length).toBeGreaterThan(1000);
    expect(submission.requestHash).toBe(recomputedRequestHash);
    expect(submission.requestHash).toMatch(/^[A-F0-9]{64}$/);
    expect(submission.responseXml).toBeNull();
    expect(submission.httpStatus).toBeNull();
    expect(submission.completedAt).toBeNull();

    expect(submission.items).toHaveLength(1);
    expect(submission.items[0].attemptNumber).toBe(1);
    expect(submission.items[0].operation).toBe(FiscalRecordKind.ALTA);

    const certificateColumns = await prisma.$queryRaw<
      Array<{ column_name: string }>
    >`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'fiscal_submissions'
        AND (
          column_name ILIKE '%certificate%'
          OR column_name ILIKE '%fingerprint%'
        )
    `;

    expect(certificateColumns).toHaveLength(0);

    await expect(
      fiscalSubmissionsService.prepare(company.id, invoice.fiscalRecord.id),
    ).rejects.toBeInstanceOf(ConflictException);

    expect(
      await prisma.fiscalSubmission.count({
        where: {
          companyId: company.id,
        },
      }),
    ).toBe(1);

    const createdDispatch = await bridgeDispatchService.createDispatch(
      company.id,
      submission.id,
    );

    expect(createdDispatch.dispatchToken).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(createdDispatch.submissionId).toBe(submission.id);
    expect(createdDispatch.requestHash).toBe(submission.requestHash);

    const persistedDispatch = await prisma.fiscalBridgeDispatch.findUnique({
      where: {
        submissionId: submission.id,
      },
    });

    expect(persistedDispatch).not.toBeNull();
    expect(persistedDispatch?.tokenHash).toBe(
      hashBridgeDispatchToken(createdDispatch.dispatchToken),
    );
    expect(persistedDispatch?.tokenHash).not.toBe(
      createdDispatch.dispatchToken,
    );
    expect(persistedDispatch?.claimedAt).toBeNull();

    const plaintextTokenColumns = await prisma.$queryRaw<
      Array<{ column_name: string }>
    >`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'fiscal_bridge_dispatches'
        AND column_name IN ('token', 'dispatchToken')
    `;

    expect(plaintextTokenColumns).toHaveLength(0);

    const claimedDispatch = await bridgeDispatchService.claimDispatch(
      createdDispatch.dispatchToken,
    );

    expect(claimedDispatch.companyId).toBe(company.id);
    expect(claimedDispatch.submissionId).toBe(submission.id);
    expect(claimedDispatch.requestHash).toBe(submission.requestHash);
    expect(claimedDispatch.requestXml).toBe(submission.requestXml);
    expect(claimedDispatch.endpoint).toBe(submission.endpoint);

    const reservedSubmission = await prisma.fiscalSubmission.findUniqueOrThrow({
      where: {
        id: submission.id,
      },
    });

    const consumedDispatch =
      await prisma.fiscalBridgeDispatch.findUniqueOrThrow({
        where: {
          submissionId: submission.id,
        },
      });

    expect(reservedSubmission.state).toBe(FiscalSubmissionState.SENDING);
    expect(consumedDispatch.claimedAt).not.toBeNull();

    await expect(
      bridgeDispatchService.claimDispatch(createdDispatch.dispatchToken),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});

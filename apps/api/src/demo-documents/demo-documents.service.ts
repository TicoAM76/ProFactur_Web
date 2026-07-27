import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { createHash, randomBytes } from 'node:crypto';
import { InvoiceDraftStatus, Prisma } from '../generated/prisma/client';
import { formatInvoiceNumber } from '../invoices/invoice-number';
import { PrismaService } from '../prisma/prisma.service';
import { buildVerifactuAltaSoapXml } from '../fiscal/verifactu-alta-xml';
import {
  formatMadridFiscalDateTime,
  formatMadridInvoiceDate,
} from '../fiscal/verifactu-datetime';
import {
  buildVerifactuAltaHashInput,
  calculateVerifactuAltaHash,
} from '../fiscal/verifactu-record-hash';
import {
  DemoDocumentSnapshot,
  DemoDocumentSnapshotLine,
} from './demo-document.types';
import {
  buildDemoOperationDescription,
  buildDemoReadiness,
  buildDemoVerificationUrl,
  resolveDemoSifConfig,
} from './demo-document.utils';

@Injectable()
export class DemoDocumentsService {
  constructor(private readonly prisma: PrismaService) {}

  private getMadridYear(date: Date): number {
    const year = new Intl.DateTimeFormat('en', {
      timeZone: 'Europe/Madrid',
      year: 'numeric',
    }).format(date);

    return Number(year);
  }

  private assertDemoTaxId(fieldName: string, value: string | null): string {
    const normalized = value?.trim().toUpperCase() ?? '';

    if (!/^[A-Z0-9]{9}$/.test(normalized)) {
      throw new BadRequestException(
        `${fieldName} debe contener 9 caracteres alfanuméricos para generar la previsualización XML F1.`,
      );
    }

    return normalized;
  }

  private buildSnapshot(
    fullNumber: string,
    issuedAt: Date,
    draft: {
      currencyCode: string;
      notes: string | null;
      subtotal: Prisma.Decimal;
      taxAmount: Prisma.Decimal;
      totalAmount: Prisma.Decimal;
      company: {
        legalName: string;
        tradeName: string | null;
        taxId: string;
        addressLine1: string;
        addressLine2: string | null;
        postalCode: string;
        city: string;
        province: string;
        countryCode: string;
        phone: string | null;
        email: string | null;
        website: string | null;
      };
      customer: {
        legalName: string;
        tradeName: string | null;
        taxId: string | null;
        addressLine1: string | null;
        addressLine2: string | null;
        postalCode: string | null;
        city: string | null;
        province: string | null;
        countryCode: string;
        phone: string | null;
        email: string | null;
      };
      vehicle: {
        registrationNumber: string;
        brand: string;
        model: string;
        version: string | null;
        vin: string | null;
        currentMileage: number | null;
      } | null;
      lines: Array<{
        position: number;
        code: string | null;
        description: string;
        quantity: Prisma.Decimal;
        unit: string;
        unitPrice: Prisma.Decimal;
        discountRate: Prisma.Decimal;
        taxRate: Prisma.Decimal;
        netAmount: Prisma.Decimal;
        taxAmount: Prisma.Decimal;
        totalAmount: Prisma.Decimal;
      }>;
    },
    customerTaxId: string,
  ): DemoDocumentSnapshot {
    const lines: DemoDocumentSnapshotLine[] = draft.lines.map((line) => ({
      position: line.position,
      code: line.code,
      description: line.description,
      quantity: line.quantity.toString(),
      unit: line.unit,
      unitPrice: line.unitPrice.toString(),
      discountRate: line.discountRate.toString(),
      taxRate: line.taxRate.toString(),
      netAmount: line.netAmount.toString(),
      taxAmount: line.taxAmount.toString(),
      totalAmount: line.totalAmount.toString(),
    }));

    return {
      fullNumber,
      issuedAt: issuedAt.toISOString(),
      currencyCode: draft.currencyCode,
      notes: draft.notes,

      sellerLegalName: draft.company.legalName,
      sellerTradeName: draft.company.tradeName,
      sellerTaxId: draft.company.taxId,
      sellerAddressLine1: draft.company.addressLine1,
      sellerAddressLine2: draft.company.addressLine2,
      sellerPostalCode: draft.company.postalCode,
      sellerCity: draft.company.city,
      sellerProvince: draft.company.province,
      sellerCountryCode: draft.company.countryCode,
      sellerPhone: draft.company.phone,
      sellerEmail: draft.company.email,
      sellerWebsite: draft.company.website,

      customerLegalName: draft.customer.legalName,
      customerTradeName: draft.customer.tradeName,
      customerTaxId,
      customerAddressLine1: draft.customer.addressLine1,
      customerAddressLine2: draft.customer.addressLine2,
      customerPostalCode: draft.customer.postalCode,
      customerCity: draft.customer.city,
      customerProvince: draft.customer.province,
      customerCountryCode: draft.customer.countryCode,
      customerPhone: draft.customer.phone,
      customerEmail: draft.customer.email,

      vehicleRegistrationNumber: draft.vehicle?.registrationNumber ?? null,
      vehicleBrand: draft.vehicle?.brand ?? null,
      vehicleModel: draft.vehicle?.model ?? null,
      vehicleVersion: draft.vehicle?.version ?? null,
      vehicleVin: draft.vehicle?.vin ?? null,
      vehicleMileage: draft.vehicle?.currentMileage ?? null,

      subtotal: draft.subtotal.toString(),
      taxAmount: draft.taxAmount.toString(),
      totalAmount: draft.totalAmount.toString(),

      lines,
    };
  }

  private async executeCreateTransaction(
    companyId: string,
    draftId: string,
    issuedAt: Date,
  ) {
    return this.prisma.$transaction(
      async (transaction) => {
        const existing = await transaction.demoDocument.findUnique({
          where: {
            sourceDraftId: draftId,
          },
        });

        if (existing) {
          if (existing.companyId !== companyId) {
            throw new NotFoundException(
              'El documento demostrativo no pertenece a esta empresa.',
            );
          }

          return existing;
        }

        const draft = await transaction.invoiceDraft.findFirst({
          where: {
            id: draftId,
            companyId,
          },
          include: {
            company: true,
            customer: true,
            vehicle: true,
            lines: {
              orderBy: {
                position: 'asc',
              },
            },
          },
        });

        if (!draft) {
          throw new NotFoundException('El borrador de factura no existe.');
        }

        if (draft.status !== InvoiceDraftStatus.READY) {
          throw new BadRequestException(
            'Solo se pueden generar documentos DEMO desde borradores READY.',
          );
        }

        if (draft.lines.length === 0) {
          throw new BadRequestException(
            'No se puede generar un documento DEMO sin líneas.',
          );
        }

        const issuerTaxId = this.assertDemoTaxId(
          'El NIF del emisor DEMO',
          draft.company.taxId,
        );

        const customerTaxId = this.assertDemoTaxId(
          'El NIF del cliente DEMO',
          draft.customer.taxId,
        );

        const year = this.getMadridYear(issuedAt);

        const series = await transaction.demoDocumentSeries.upsert({
          where: {
            companyId_code_year: {
              companyId,
              code: 'DEMO',
              year,
            },
          },
          create: {
            companyId,
            code: 'DEMO',
            year,
            nextNumber: 1,
            padding: 6,
          },
          update: {},
        });

        const reservedSeries = await transaction.demoDocumentSeries.update({
          where: {
            id: series.id,
          },
          data: {
            nextNumber: {
              increment: 1,
            },
          },
          select: {
            id: true,
            code: true,
            year: true,
            nextNumber: true,
            padding: true,
          },
        });

        const number = reservedSeries.nextNumber - 1;

        const fullNumber = formatInvoiceNumber(
          reservedSeries.code,
          reservedSeries.year,
          number,
          reservedSeries.padding,
        );

        const snapshot = this.buildSnapshot(
          fullNumber,
          issuedAt,
          draft,
          customerTaxId,
        );

        const generatedAtWithOffset = formatMadridFiscalDateTime(issuedAt);
        const invoiceDate = formatMadridInvoiceDate(issuedAt);

        const hashData = {
          issuerTaxId,
          invoiceNumber: fullNumber,
          invoiceDate,
          invoiceType: 'F1' as const,
          totalTaxAmount: snapshot.taxAmount,
          totalAmount: snapshot.totalAmount,
          previousHash: null,
          generatedAt: generatedAtWithOffset,
        };

        const fiscalHashInput = buildVerifactuAltaHashInput(hashData);
        const fiscalHash = calculateVerifactuAltaHash(hashData);

        const xmlPreview = buildVerifactuAltaSoapXml({
          issuerName: snapshot.sellerLegalName,
          issuerTaxId,
          invoiceNumber: fullNumber,
          invoiceDate,
          description: buildDemoOperationDescription(
            snapshot.lines,
            snapshot.notes,
          ),
          customerName: snapshot.customerLegalName,
          customerTaxId,
          totalTaxAmount: snapshot.taxAmount,
          totalAmount: snapshot.totalAmount,
          lines: snapshot.lines.map((line) => ({
            taxRate: line.taxRate,
            netAmount: line.netAmount,
            taxAmount: line.taxAmount,
          })),
          previousRecord: null,
          generatedAtWithOffset,
          hash: fiscalHash,
          sif: resolveDemoSifConfig(),
        });

        const xmlHash = createHash('sha256')
          .update(xmlPreview, 'utf8')
          .digest('hex')
          .toUpperCase();

        const qrToken = randomBytes(24).toString('hex');
        const qrUrl = buildDemoVerificationUrl(qrToken);

        return transaction.demoDocument.create({
          data: {
            companyId,
            seriesId: reservedSeries.id,
            sourceDraftId: draft.id,
            number,
            fullNumber,
            issuedAt,
            currencyCode: draft.currencyCode,
            snapshot: snapshot as unknown as Prisma.InputJsonValue,
            qrToken,
            qrUrl,
            fiscalHashInput,
            fiscalHash,
            generatedAtWithOffset,
            xmlPreview,
            xmlHash,
          },
        });
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      },
    );
  }

  async createFromDraft(companyId: string, draftId: string) {
    const issuedAt = new Date();

    for (let attempt = 1; attempt <= 3; attempt += 1) {
      try {
        return await this.executeCreateTransaction(
          companyId,
          draftId,
          issuedAt,
        );
      } catch (error: unknown) {
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === 'P2034' &&
          attempt < 3
        ) {
          continue;
        }

        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === 'P2002'
        ) {
          const existing = await this.prisma.demoDocument.findUnique({
            where: {
              sourceDraftId: draftId,
            },
          });

          if (existing?.companyId === companyId) {
            return existing;
          }

          throw new ConflictException(
            'El documento DEMO ya existe o el número ya está ocupado.',
          );
        }

        throw error;
      }
    }

    throw new ServiceUnavailableException(
      'No fue posible reservar un número DEMO. Inténtalo nuevamente.',
    );
  }

  findAll(companyId: string) {
    return this.prisma.demoDocument.findMany({
      where: {
        companyId,
      },
      select: {
        id: true,
        companyId: true,
        sourceDraftId: true,
        fullNumber: true,
        issuedAt: true,
        currencyCode: true,
        qrUrl: true,
        fiscalHash: true,
        xmlHash: true,
        pdfHash: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        issuedAt: 'desc',
      },
    });
  }

  async findOne(companyId: string, documentId: string) {
    const document = await this.prisma.demoDocument.findFirst({
      where: {
        id: documentId,
        companyId,
      },
    });

    if (!document) {
      throw new NotFoundException(
        'El documento demostrativo solicitado no existe.',
      );
    }

    return document;
  }

  async getXml(companyId: string, documentId: string): Promise<string> {
    const document = await this.findOne(companyId, documentId);

    return document.xmlPreview;
  }

  async getReadiness(companyId: string, documentId: string) {
    const document = await this.findOne(companyId, documentId);

    return {
      documentId: document.id,
      fullNumber: document.fullNumber,
      fiscalHash: document.fiscalHash,
      xmlHash: document.xmlHash,
      qrUrl: document.qrUrl,
      ...buildDemoReadiness(),
    };
  }

  async verifyByToken(qrToken: string) {
    const document = await this.prisma.demoDocument.findUnique({
      where: {
        qrToken,
      },
    });

    if (!document) {
      throw new NotFoundException(
        'El documento DEMO no existe o el código no es válido.',
      );
    }

    const snapshot = document.snapshot as unknown as DemoDocumentSnapshot;

    return {
      status: 'DEMO',
      recognizedByProfactur: true,
      fullNumber: document.fullNumber,
      issuedAt: document.issuedAt,
      seller: snapshot.sellerTradeName ?? snapshot.sellerLegalName,
      totalAmount: snapshot.totalAmount,
      currencyCode: snapshot.currencyCode,
      qrLabel: 'QR DEMO — NO AEAT',
      aeatSubmitted: false,
      aeatAccepted: false,
      disclaimer:
        'Documento de demostración sin validez fiscal. No remitido a la Agencia Tributaria.',
    };
  }
}

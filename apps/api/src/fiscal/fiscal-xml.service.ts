import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { FiscalRecordKind } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { buildVerifactuAltaSoapXml } from './verifactu-alta-xml';
import { loadVerifactuSifConfig } from './verifactu-sif-config';

export interface GeneratedFiscalXml {
  fileName: string;
  xml: string;
}

@Injectable()
export class FiscalXmlService {
  constructor(private readonly prisma: PrismaService) {}

  private buildOperationDescription(
    notes: string | null,
    lineDescriptions: string[],
  ): string {
    const normalizedNotes = notes?.trim();

    const description =
      normalizedNotes ||
      lineDescriptions
        .map((value) => value.trim())
        .filter(Boolean)
        .join('; ');

    if (!description) {
      throw new BadRequestException(
        'La factura no contiene una descripción fiscal de la operación.',
      );
    }

    if (description.length > 500) {
      throw new BadRequestException(
        'La descripción fiscal de la operación supera 500 caracteres.',
      );
    }

    return description;
  }

  async generateAltaXml(
    companyId: string,
    recordId: string,
  ): Promise<GeneratedFiscalXml> {
    const record = await this.prisma.fiscalRecord.findFirst({
      where: {
        id: recordId,
        companyId,
        kind: FiscalRecordKind.ALTA,
      },
      include: {
        invoice: {
          include: {
            lines: {
              orderBy: {
                position: 'asc',
              },
            },
          },
        },
        previousRecord: true,
      },
    });

    if (!record) {
      throw new NotFoundException(
        'El registro fiscal de alta solicitado no existe.',
      );
    }

    const invoice = record.invoice;

    if (!invoice.customerTaxId) {
      throw new BadRequestException(
        'La factura no contiene el NIF del destinatario.',
      );
    }

    if (invoice.lines.length === 0) {
      throw new BadRequestException(
        'La factura no contiene líneas para generar el desglose fiscal.',
      );
    }

    const description = this.buildOperationDescription(
      invoice.notes,
      invoice.lines.map((line) => line.description),
    );

    const sif = loadVerifactuSifConfig();

    try {
      const xml = buildVerifactuAltaSoapXml({
        issuerName: invoice.sellerLegalName,
        issuerTaxId: record.issuerTaxId,

        invoiceNumber: record.invoiceNumber,
        invoiceDate: record.invoiceDate,
        description,

        customerName: invoice.customerLegalName,
        customerTaxId: invoice.customerTaxId,

        totalTaxAmount: record.totalTaxAmount.toString(),
        totalAmount: record.totalAmount.toString(),

        lines: invoice.lines.map((line) => ({
          taxRate: line.taxRate.toString(),
          netAmount: line.netAmount.toString(),
          taxAmount: line.taxAmount.toString(),
        })),

        previousRecord: record.previousRecord
          ? {
              issuerTaxId: record.previousRecord.issuerTaxId,
              invoiceNumber: record.previousRecord.invoiceNumber,
              invoiceDate: record.previousRecord.invoiceDate,
              hash: record.previousRecord.hash,
            }
          : null,

        generatedAtWithOffset: record.generatedAtWithOffset,

        hash: record.hash,

        sif,
      });

      const safeInvoiceNumber = record.invoiceNumber.replace(
        /[^A-Za-z0-9_-]/g,
        '_',
      );

      return {
        fileName:
          `VERIFACTU-${safeInvoiceNumber}` + `-SEQ-${record.sequence}.xml`,
        xml,
      };
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Error desconocido';

      throw new BadRequestException(
        `No fue posible generar el XML fiscal: ${message}`,
      );
    }
  }
}

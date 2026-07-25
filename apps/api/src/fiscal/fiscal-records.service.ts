import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import {
  FiscalEnvironment,
  FiscalInvoiceType,
  FiscalRecordKind,
  FiscalRecordState,
  Prisma,
} from '../generated/prisma/client';
import { buildVerifactuQrUrl } from '../invoices/invoice-verifactu-qr-url';
import {
  buildVerifactuAltaHashInput,
  calculateVerifactuAltaHash,
} from './verifactu-record-hash';
import {
  formatMadridFiscalDateTime,
  formatMadridInvoiceDate,
} from './verifactu-datetime';

export interface FiscalAltaInvoiceInput {
  invoiceId: string;
  companyId: string;
  issuerTaxId: string;
  invoiceNumber: string;
  issuedAt: Date;
  totalTaxAmount: Prisma.Decimal;
  totalAmount: Prisma.Decimal;
}

@Injectable()
export class FiscalRecordsService {
  private resolveEnvironment(): FiscalEnvironment {
    const value = (process.env.VERIFACTU_ENVIRONMENT ?? 'TEST')
      .trim()
      .toUpperCase();

    if (value === FiscalEnvironment.TEST) {
      return FiscalEnvironment.TEST;
    }

    if (value === FiscalEnvironment.PRODUCTION) {
      return FiscalEnvironment.PRODUCTION;
    }

    throw new Error('VERIFACTU_ENVIRONMENT debe ser TEST o PRODUCTION.');
  }

  private resolveInstallationNumber(): string {
    const value = (process.env.VERIFACTU_INSTALLATION_NUMBER ?? '1').trim();

    if (!value) {
      throw new Error('VERIFACTU_INSTALLATION_NUMBER no puede estar vacío.');
    }

    if (value.length > 50) {
      throw new Error(
        'VERIFACTU_INSTALLATION_NUMBER no puede superar 50 caracteres.',
      );
    }

    return value;
  }

  private toQrEnvironment(
    environment: FiscalEnvironment,
  ): 'test' | 'production' {
    return environment === FiscalEnvironment.PRODUCTION ? 'production' : 'test';
  }

  async createAltaRecord(
    transaction: Prisma.TransactionClient,
    invoice: FiscalAltaInvoiceInput,
  ) {
    const environment = this.resolveEnvironment();

    const installationNumber = this.resolveInstallationNumber();

    const chain = await transaction.fiscalChain.upsert({
      where: {
        companyId_environment_installationNumber: {
          companyId: invoice.companyId,
          environment,
          installationNumber,
        },
      },
      create: {
        companyId: invoice.companyId,
        environment,
        installationNumber,
        nextSequence: 1,
        isActive: true,
      },
      update: {},
    });

    if (!chain.isActive) {
      throw new BadRequestException(
        'La cadena fiscal seleccionada está inactiva.',
      );
    }

    const reservedChain = await transaction.fiscalChain.update({
      where: {
        id: chain.id,
      },
      data: {
        nextSequence: {
          increment: 1,
        },
      },
      select: {
        id: true,
        nextSequence: true,
      },
    });

    const sequence = reservedChain.nextSequence - 1;

    const previousRecord =
      sequence === 1
        ? null
        : await transaction.fiscalRecord.findUnique({
            where: {
              chainId_sequence: {
                chainId: chain.id,
                sequence: sequence - 1,
              },
            },
          });

    if (sequence > 1 && !previousRecord) {
      throw new ConflictException(
        'La cadena fiscal está incompleta: no existe el registro anterior.',
      );
    }

    const generatedAt = new Date();

    const generatedAtWithOffset = formatMadridFiscalDateTime(generatedAt);

    const invoiceDate = formatMadridInvoiceDate(invoice.issuedAt);

    const hashData = {
      issuerTaxId: invoice.issuerTaxId,
      invoiceNumber: invoice.invoiceNumber,
      invoiceDate,
      invoiceType: 'F1' as const,
      totalTaxAmount: invoice.totalTaxAmount.toString(),
      totalAmount: invoice.totalAmount.toString(),
      previousHash: previousRecord?.hash ?? null,
      generatedAt: generatedAtWithOffset,
    };

    const hashInput = buildVerifactuAltaHashInput(hashData);

    const hash = calculateVerifactuAltaHash(hashData);

    const qrUrl = buildVerifactuQrUrl({
      environment: this.toQrEnvironment(environment),
      issuerTaxId: invoice.issuerTaxId,
      invoiceNumber: invoice.invoiceNumber,
      issuedAt: invoice.issuedAt,
      totalAmount: invoice.totalAmount.toString(),
    });

    return transaction.fiscalRecord.create({
      data: {
        chainId: chain.id,
        companyId: invoice.companyId,
        invoiceId: invoice.invoiceId,
        sequence,
        kind: FiscalRecordKind.ALTA,
        state: FiscalRecordState.PENDING_SUBMISSION,
        invoiceType: FiscalInvoiceType.F1,

        issuerTaxId: invoice.issuerTaxId,
        invoiceNumber: invoice.invoiceNumber,
        invoiceDate,

        totalTaxAmount: invoice.totalTaxAmount,
        totalAmount: invoice.totalAmount,

        previousRecordId: previousRecord?.id ?? null,
        previousInvoiceNumber: previousRecord?.invoiceNumber ?? null,
        previousInvoiceDate: previousRecord?.invoiceDate ?? null,
        previousHash: previousRecord?.hash ?? null,

        hashInput,
        hash,

        generatedAt,
        generatedAtWithOffset,

        qrUrl,
      },
    });
  }
}

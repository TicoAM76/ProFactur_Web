import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { InvoiceDraftStatus, Prisma } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { IssueInvoiceDto } from './dto/issue-invoice.dto';
import { formatInvoiceNumber } from './invoice-number';

@Injectable()
export class InvoicesService {
  constructor(private readonly prisma: PrismaService) {}

  private getSeriesYear(date: Date): number {
    const year = new Intl.DateTimeFormat('en', {
      timeZone: 'Europe/Madrid',
      year: 'numeric',
    }).format(date);

    return Number(year);
  }

  private normalizeSeriesCode(value?: string): string {
    return value?.trim().toUpperCase() || 'F';
  }

  private async executeIssuanceTransaction(
    companyId: string,
    draftId: string,
    data: IssueInvoiceDto,
    issuedAt: Date,
  ) {
    return this.prisma.$transaction(
      async (transaction) => {
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
            'Solo se pueden emitir borradores en estado READY.',
          );
        }

        if (draft.lines.length === 0) {
          throw new BadRequestException(
            'No se puede emitir una factura sin líneas.',
          );
        }

        const previousInvoice = await transaction.invoice.findUnique({
          where: {
            sourceDraftId: draftId,
          },
          select: {
            id: true,
            fullNumber: true,
          },
        });

        if (previousInvoice) {
          throw new ConflictException(
            `Este borrador ya fue convertido en la factura ${previousInvoice.fullNumber}.`,
          );
        }

        const seriesCode = this.normalizeSeriesCode(data.seriesCode);

        const year = this.getSeriesYear(issuedAt);

        const series = await transaction.invoiceSeries.upsert({
          where: {
            companyId_code_year: {
              companyId,
              code: seriesCode,
              year,
            },
          },
          create: {
            companyId,
            code: seriesCode,
            year,
            nextNumber: 1,
            padding: 6,
            isActive: true,
          },
          update: {},
        });

        if (!series.isActive) {
          throw new BadRequestException(
            'La serie de facturación seleccionada está inactiva.',
          );
        }

        const updatedSeries = await transaction.invoiceSeries.update({
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
            padding: true,
            nextNumber: true,
          },
        });

        const number = updatedSeries.nextNumber - 1;

        const fullNumber = formatInvoiceNumber(
          updatedSeries.code,
          updatedSeries.year,
          number,
          updatedSeries.padding,
        );

        const dueAt = data.dueAt ? new Date(data.dueAt) : null;

        const invoice = await transaction.invoice.create({
          data: {
            companyId,
            seriesId: updatedSeries.id,
            sourceDraftId: draft.id,
            customerId: draft.customerId,
            vehicleId: draft.vehicleId,
            number,
            fullNumber,
            issuedAt,
            dueAt,
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

            customerLegalName: draft.customer.legalName,
            customerTradeName: draft.customer.tradeName,
            customerTaxId: draft.customer.taxId,
            customerAddressLine1: draft.customer.addressLine1,
            customerAddressLine2: draft.customer.addressLine2,
            customerPostalCode: draft.customer.postalCode,
            customerCity: draft.customer.city,
            customerProvince: draft.customer.province,
            customerCountryCode: draft.customer.countryCode,

            vehicleRegistrationNumber: draft.vehicle?.registrationNumber,
            vehicleBrand: draft.vehicle?.brand,
            vehicleModel: draft.vehicle?.model,
            vehicleVersion: draft.vehicle?.version,
            vehicleVin: draft.vehicle?.vin,
            vehicleMileage: draft.vehicle?.currentMileage,

            subtotal: draft.subtotal,
            taxAmount: draft.taxAmount,
            totalAmount: draft.totalAmount,

            lines: {
              create: draft.lines.map((line) => ({
                catalogItemId: line.catalogItemId,
                position: line.position,
                type: line.type,
                code: line.code,
                description: line.description,
                quantity: line.quantity,
                unit: line.unit,
                unitPrice: line.unitPrice,
                discountRate: line.discountRate,
                taxRate: line.taxRate,
                netAmount: line.netAmount,
                taxAmount: line.taxAmount,
                totalAmount: line.totalAmount,
              })),
            },
          },
          include: {
            series: true,
            customer: true,
            vehicle: true,
            lines: {
              orderBy: {
                position: 'asc',
              },
            },
          },
        });

        await transaction.invoiceDraft.update({
          where: {
            id: draft.id,
          },
          data: {
            status: InvoiceDraftStatus.CONVERTED,
            convertedAt: issuedAt,
          },
        });

        return invoice;
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      },
    );
  }

  async issueFromDraft(
    companyId: string,
    draftId: string,
    data: IssueInvoiceDto,
  ) {
    const issuedAt = new Date();

    for (let attempt = 1; attempt <= 3; attempt += 1) {
      try {
        return await this.executeIssuanceTransaction(
          companyId,
          draftId,
          data,
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
          throw new ConflictException(
            'La factura ya fue emitida o el número ya está ocupado.',
          );
        }

        throw error;
      }
    }

    throw new ServiceUnavailableException(
      'No fue posible reservar un número de factura. Inténtalo nuevamente.',
    );
  }

  findAll(companyId: string) {
    return this.prisma.invoice.findMany({
      where: {
        companyId,
      },
      include: {
        series: true,
        customer: true,
        vehicle: true,
        _count: {
          select: {
            lines: true,
          },
        },
      },
      orderBy: {
        issuedAt: 'desc',
      },
    });
  }

  async findOne(companyId: string, invoiceId: string) {
    const invoice = await this.prisma.invoice.findFirst({
      where: {
        id: invoiceId,
        companyId,
      },
      include: {
        series: true,
        customer: true,
        vehicle: true,
        lines: {
          orderBy: {
            position: 'asc',
          },
        },
      },
    });

    if (!invoice) {
      throw new NotFoundException('La factura solicitada no existe.');
    }

    return invoice;
  }
}

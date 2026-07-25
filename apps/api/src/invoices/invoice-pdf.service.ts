import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  InvoicePdfDocumentData,
  renderInvoicePdf,
} from './invoice-pdf.renderer';

export interface GeneratedInvoicePdf {
  fileName: string;
  buffer: Buffer;
}

@Injectable()
export class InvoicePdfService {
  constructor(private readonly prisma: PrismaService) {}

  async generate(
    companyId: string,
    invoiceId: string,
  ): Promise<GeneratedInvoicePdf> {
    const invoice = await this.prisma.invoice.findFirst({
      where: {
        id: invoiceId,
        companyId,
      },
      include: {
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

    const pdfData: InvoicePdfDocumentData = {
      fullNumber: invoice.fullNumber,
      issuedAt: invoice.issuedAt,
      currencyCode: invoice.currencyCode,
      notes: invoice.notes,

      sellerLegalName: invoice.sellerLegalName,
      sellerTradeName: invoice.sellerTradeName,
      sellerTaxId: invoice.sellerTaxId,
      sellerAddressLine1: invoice.sellerAddressLine1,
      sellerAddressLine2: invoice.sellerAddressLine2,
      sellerPostalCode: invoice.sellerPostalCode,
      sellerCity: invoice.sellerCity,
      sellerProvince: invoice.sellerProvince,
      sellerCountryCode: invoice.sellerCountryCode,

      customerLegalName: invoice.customerLegalName,
      customerTradeName: invoice.customerTradeName,
      customerTaxId: invoice.customerTaxId,
      customerAddressLine1: invoice.customerAddressLine1,
      customerAddressLine2: invoice.customerAddressLine2,
      customerPostalCode: invoice.customerPostalCode,
      customerCity: invoice.customerCity,
      customerProvince: invoice.customerProvince,
      customerCountryCode: invoice.customerCountryCode,

      vehicleRegistrationNumber: invoice.vehicleRegistrationNumber,
      vehicleBrand: invoice.vehicleBrand,
      vehicleModel: invoice.vehicleModel,
      vehicleVersion: invoice.vehicleVersion,
      vehicleVin: invoice.vehicleVin,
      vehicleMileage: invoice.vehicleMileage,

      subtotal: invoice.subtotal.toString(),
      taxAmount: invoice.taxAmount.toString(),
      totalAmount: invoice.totalAmount.toString(),

      lines: invoice.lines.map((line) => ({
        position: line.position,
        code: line.code,
        description: line.description,
        quantity: line.quantity.toString(),
        unit: line.unit,
        unitPrice: line.unitPrice.toString(),
        taxRate: line.taxRate.toString(),
        netAmount: line.netAmount.toString(),
        taxAmount: line.taxAmount.toString(),
        totalAmount: line.totalAmount.toString(),
      })),

      footerNotice:
        process.env.NODE_ENV === 'production'
          ? null
          : 'ENTORNO DE DESARROLLO - DOCUMENTO DE PRUEBA',
    };

    const buffer = await renderInvoicePdf(pdfData);

    const safeNumber = invoice.fullNumber.replace(/[^A-Za-z0-9_-]/g, '_');

    return {
      fileName: `${safeNumber}.pdf`,
      buffer,
    };
  }
}

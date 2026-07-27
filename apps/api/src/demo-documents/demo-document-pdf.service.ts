import { Injectable, NotFoundException } from '@nestjs/common';
import { createHash } from 'node:crypto';
import * as QRCode from 'qrcode';
import {
  InvoicePdfDocumentData,
  renderInvoicePdf,
} from '../invoices/invoice-pdf.renderer';
import { PrismaService } from '../prisma/prisma.service';
import { DemoDocumentSnapshot } from './demo-document.types';
import { getDemoFooterLines } from './demo-document.utils';

export interface GeneratedDemoDocumentPdf {
  fileName: string;
  buffer: Buffer;
}

@Injectable()
export class DemoDocumentPdfService {
  constructor(private readonly prisma: PrismaService) {}

  async generate(
    companyId: string,
    documentId: string,
  ): Promise<GeneratedDemoDocumentPdf> {
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

    const snapshot = document.snapshot as unknown as DemoDocumentSnapshot;

    const qrImage = await QRCode.toBuffer(document.qrUrl, {
      type: 'png',
      width: 180,
      margin: 1,
      errorCorrectionLevel: 'M',
    });

    const pdfData: InvoicePdfDocumentData = {
      documentTitle: 'FACTURA DEMO',
      documentSubtitle: 'SIMULACIÓN SIN VALIDEZ FISCAL',
      watermark: 'DEMO',

      fullNumber: snapshot.fullNumber,
      issuedAt: new Date(snapshot.issuedAt),
      currencyCode: snapshot.currencyCode,
      notes: snapshot.notes,

      sellerLegalName: snapshot.sellerLegalName,
      sellerTradeName: snapshot.sellerTradeName,
      sellerTaxId: snapshot.sellerTaxId,
      sellerAddressLine1: snapshot.sellerAddressLine1,
      sellerAddressLine2: snapshot.sellerAddressLine2,
      sellerPostalCode: snapshot.sellerPostalCode,
      sellerCity: snapshot.sellerCity,
      sellerProvince: snapshot.sellerProvince,
      sellerCountryCode: snapshot.sellerCountryCode,
      sellerPhone: snapshot.sellerPhone,
      sellerEmail: snapshot.sellerEmail,
      sellerWebsite: snapshot.sellerWebsite,

      customerLegalName: snapshot.customerLegalName,
      customerTradeName: snapshot.customerTradeName,
      customerTaxId: snapshot.customerTaxId,
      customerAddressLine1: snapshot.customerAddressLine1,
      customerAddressLine2: snapshot.customerAddressLine2,
      customerPostalCode: snapshot.customerPostalCode,
      customerCity: snapshot.customerCity,
      customerProvince: snapshot.customerProvince,
      customerCountryCode: snapshot.customerCountryCode,
      customerPhone: snapshot.customerPhone,
      customerEmail: snapshot.customerEmail,

      vehicleRegistrationNumber: snapshot.vehicleRegistrationNumber,
      vehicleBrand: snapshot.vehicleBrand,
      vehicleModel: snapshot.vehicleModel,
      vehicleVersion: snapshot.vehicleVersion,
      vehicleVin: snapshot.vehicleVin,
      vehicleMileage: snapshot.vehicleMileage,

      subtotal: snapshot.subtotal,
      taxAmount: snapshot.taxAmount,
      totalAmount: snapshot.totalAmount,
      lines: snapshot.lines,

      footerNotice: 'DOCUMENTO DEMO — SIN VALIDEZ FISCAL',
      demoFooter: {
        qrImage,
        qrLabel: 'QR DEMO — NO AEAT',
        verificationUrl: document.qrUrl,
        readinessLines: [...getDemoFooterLines()],
        disclaimer:
          'Documento de demostración sin validez fiscal. No remitido a la Agencia Tributaria.',
      },
    };

    const buffer = await renderInvoicePdf(pdfData);

    const pdfHash = createHash('sha256')
      .update(buffer)
      .digest('hex')
      .toUpperCase();

    if (document.pdfHash !== pdfHash) {
      await this.prisma.demoDocument.update({
        where: {
          id: document.id,
        },
        data: {
          pdfHash,
        },
      });
    }

    const safeNumber = document.fullNumber.replace(/[^A-Za-z0-9_-]/g, '_');

    return {
      fileName: `${safeNumber}.pdf`,
      buffer,
    };
  }
}

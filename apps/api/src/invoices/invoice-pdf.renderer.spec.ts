import {
  formatInvoiceAmount,
  InvoicePdfDocumentData,
  renderInvoicePdf,
} from './invoice-pdf.renderer';

describe('invoice PDF renderer', () => {
  it('formatea importes en euros con dos decimales', () => {
    expect(formatInvoiceAmount('325', 'EUR')).toBe('325,00 €');

    expect(formatInvoiceAmount('68.25', 'EUR')).toBe('68,25 €');
  });

  it('genera un documento PDF válido', async () => {
    const invoice: InvoicePdfDocumentData = {
      fullNumber: 'F-2026-000001',
      issuedAt: new Date('2026-07-25T11:07:16.808Z'),
      currencyCode: 'EUR',
      notes: 'Sustitución de electroventilador y mano de obra',

      sellerLegalName: 'Taller FacturTaller SL',
      sellerTradeName: 'Taller FacturTaller',
      sellerTaxId: 'B12345678',
      sellerAddressLine1: 'Calle del Taller 1',
      sellerAddressLine2: null,
      sellerPostalCode: '46001',
      sellerCity: 'Valencia',
      sellerProvince: 'Valencia',
      sellerCountryCode: 'ES',
      sellerPhone: '645642445',
      sellerEmail: 'taller@profactur.test',
      sellerWebsite: 'www.profactur.test',

      customerLegalName: 'Rafael Alberto Felipe Feliu',
      customerTradeName: null,
      customerTaxId: '09845729G',
      customerAddressLine1: 'Avenida Mediterráneo 28',
      customerAddressLine2: null,
      customerPostalCode: '03503',
      customerCity: 'Benidorm',
      customerProvince: 'Alicante',
      customerCountryCode: 'ES',
      customerPhone: '655954711',
      customerEmail: 'rafael@profactur.test',

      vehicleRegistrationNumber: '4187LRS',
      vehicleBrand: 'Renault',
      vehicleModel: 'Clio 5',
      vehicleVersion: 'Clio V',
      vehicleVin: 'VF1PROFACTUR000001',
      vehicleMileage: 99154,

      subtotal: '325',
      taxAmount: '68.25',
      totalAmount: '393.25',

      lines: [
        {
          position: 1,
          code: 'ELECTRO-001',
          description: 'Electroventilador',
          quantity: '1',
          unit: 'UD',
          netAmount: '285',
          taxAmount: '59.85',
          unitPrice: '285',
          taxRate: '21',
          totalAmount: '344.85',
        },
        {
          position: 2,
          code: 'MO-HORA',
          description: 'Hora de mano de obra',
          quantity: '1',
          unit: 'HORA',
          unitPrice: '40',
          taxRate: '21',
          netAmount: '40',
          taxAmount: '8.40',
          totalAmount: '48.40',
        },
      ],

      footerNotice: 'ENTORNO DE DESARROLLO - DOCUMENTO DE PRUEBA',
    };

    const pdf = await renderInvoicePdf(invoice);

    expect(pdf.subarray(0, 5).toString('ascii')).toBe('%PDF-');

    expect(pdf.length).toBeGreaterThan(1000);
  });

  it('genera un PDF DEMO con QR y pie de preparación fiscal', async () => {
    const invoice: InvoicePdfDocumentData = {
      documentTitle: 'FACTURA DEMO',
      documentSubtitle: 'SIMULACIÓN SIN VALIDEZ FISCAL',
      watermark: 'DEMO',
      fullNumber: 'DEMO-2026-000001',
      issuedAt: new Date('2026-07-26T12:00:00.000Z'),
      currencyCode: 'EUR',
      notes: 'Reparación y pintura de parachoques',

      sellerLegalName: 'EMPRESA DEMO - SIN VALIDEZ FISCAL',
      sellerTradeName: 'Taller Martín Brothers Paint & Body Shop',
      sellerTaxId: 'B00000000',
      sellerAddressLine1: 'Dirección de demostración',
      sellerAddressLine2: null,
      sellerPostalCode: '46000',
      sellerCity: 'Valencia',
      sellerProvince: 'Valencia',
      sellerCountryCode: 'ES',
      sellerPhone: null,
      sellerEmail: 'demo@profactur.local',
      sellerWebsite: null,

      customerLegalName: 'Cliente Demostración',
      customerTradeName: null,
      customerTaxId: '00000000T',
      customerAddressLine1: null,
      customerAddressLine2: null,
      customerPostalCode: null,
      customerCity: null,
      customerProvince: null,
      customerCountryCode: 'ES',
      customerPhone: null,
      customerEmail: null,

      vehicleRegistrationNumber: '1234-DEM',
      vehicleBrand: 'Toyota',
      vehicleModel: 'Corolla',
      vehicleVersion: null,
      vehicleVin: 'DEMO0000000000001',
      vehicleMileage: 125000,

      subtotal: '300',
      taxAmount: '63',
      totalAmount: '363',

      lines: [
        {
          position: 1,
          code: 'PINT-001',
          description: 'Reparación y pintura de parachoques',
          quantity: '1',
          unit: 'UD',
          unitPrice: '300',
          taxRate: '21',
          netAmount: '300',
          taxAmount: '63',
          totalAmount: '363',
        },
      ],

      footerNotice: 'DOCUMENTO DEMO — SIN VALIDEZ FISCAL',
      demoFooter: {
        qrImage: Buffer.from(
          'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
          'base64',
        ),
        qrLabel: 'QR DEMO — NO AEAT',
        verificationUrl: 'https://demo.profactur.es/demo/verify/example',
        readinessLines: [
          'Estructura validada contra el XSD oficial.',
          'Registro y XML preparados para prueba de integración.',
          'Pendiente de certificado válido y envío real en TEST.',
        ],
        disclaimer:
          'Documento de demostración sin validez fiscal. No remitido a la Agencia Tributaria.',
      },
    };

    const pdf = await renderInvoicePdf(invoice);

    expect(pdf.subarray(0, 5).toString('ascii')).toBe('%PDF-');
    expect(pdf.length).toBeGreaterThan(1000);
  });
});

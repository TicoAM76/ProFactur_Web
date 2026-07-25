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

      sellerLegalName: 'Taller Profactur SL',
      sellerTradeName: 'Taller Profactur',
      sellerTaxId: 'B12345678',
      sellerAddressLine1: 'Calle del Taller 1',
      sellerAddressLine2: null,
      sellerPostalCode: '46001',
      sellerCity: 'Valencia',
      sellerProvince: 'Valencia',
      sellerCountryCode: 'ES',

      customerLegalName: 'Rafael Alberto Felipe Feliu',
      customerTradeName: null,
      customerTaxId: '09845729G',
      customerAddressLine1: 'Avenida Mediterráneo 28',
      customerAddressLine2: null,
      customerPostalCode: '03503',
      customerCity: 'Benidorm',
      customerProvince: 'Alicante',
      customerCountryCode: 'ES',

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
          totalAmount: '48.40',
        },
      ],

      footerNotice: 'ENTORNO DE DESARROLLO - DOCUMENTO DE PRUEBA',
    };

    const pdf = await renderInvoicePdf(invoice);

    expect(pdf.subarray(0, 5).toString('ascii')).toBe('%PDF-');

    expect(pdf.length).toBeGreaterThan(1000);
  });
});

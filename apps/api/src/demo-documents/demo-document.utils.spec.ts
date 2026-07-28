import {
  buildDemoOperationDescription,
  buildDemoReadiness,
  buildDemoVerificationUrl,
  getDemoFooterLines,
} from './demo-document.utils';

describe('demo document utils', () => {
  it('construye la URL de verificación sin doble barra', () => {
    const previous = process.env.PROFACTUR_DEMO_VERIFY_BASE_URL;

    process.env.PROFACTUR_DEMO_VERIFY_BASE_URL =
      'https://demo.profactur.es/demo/verify/';

    expect(buildDemoVerificationUrl('abc123')).toBe(
      'https://demo.profactur.es/demo/verify/abc123',
    );

    if (previous === undefined) {
      delete process.env.PROFACTUR_DEMO_VERIFY_BASE_URL;
    } else {
      process.env.PROFACTUR_DEMO_VERIFY_BASE_URL = previous;
    }
  });

  it('mantiene el texto exacto del pie DEMO', () => {
    expect(getDemoFooterLines()).toEqual([
      'Estructura y XML preparados para integraci\u00f3n VeriFactu.',
      'Pendiente de certificado y env\u00edo real en AEAT TEST.',
    ]);
  });
  it('construye una descripción de operación desde las líneas', () => {
    const result = buildDemoOperationDescription(
      [
        {
          position: 1,
          code: 'PINT-001',
          description: 'Pintura de parachoques',
          quantity: '1',
          unit: 'UD',
          unitPrice: '250',
          discountRate: '0',
          taxRate: '21',
          netAmount: '250',
          taxAmount: '52.5',
          totalAmount: '302.5',
        },
      ],
      'Incluye preparación',
    );

    expect(result).toBe('Pintura de parachoques. Incluye preparación');
  });

  it('declara claramente que no existe envío AEAT', () => {
    expect(buildDemoReadiness()).toMatchObject({
      mode: 'DEMO',
      xsdStructureValidated: true,
      qrMode: 'DEMO_NO_AEAT',
      certificateConfigured: false,
      bridgeConfigured: false,
      aeatSubmitted: false,
      aeatAccepted: false,
    });
  });
});

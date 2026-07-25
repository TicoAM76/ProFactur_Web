import {
  buildVerifactuAltaHashInput,
  calculateVerifactuAltaHash,
} from './verifactu-record-hash';

describe('VERI*FACTU record hash', () => {
  it('reproduce la huella oficial del primer registro de alta', () => {
    const input = {
      issuerTaxId: '89890001K',
      invoiceNumber: '12345678/G33',
      invoiceDate: '01-01-2024',
      invoiceType: 'F1' as const,
      totalTaxAmount: '12.35',
      totalAmount: '123.45',
      previousHash: null,
      generatedAt: '2024-01-01T19:20:30+01:00',
    };

    expect(buildVerifactuAltaHashInput(input)).toBe(
      [
        'IDEmisorFactura=89890001K',
        'NumSerieFactura=12345678/G33',
        'FechaExpedicionFactura=01-01-2024',
        'TipoFactura=F1',
        'CuotaTotal=12.35',
        'ImporteTotal=123.45',
        'Huella=',
        'FechaHoraHusoGenRegistro=2024-01-01T19:20:30+01:00',
      ].join('&'),
    );

    expect(calculateVerifactuAltaHash(input)).toBe(
      '3C464DAF61ACB827C65FDA19F352A4E3BDC2C640E9E9FC4CC058073F38F12F60',
    );
  });

  it('reproduce la huella oficial del segundo registro encadenado', () => {
    const result = calculateVerifactuAltaHash({
      issuerTaxId: '89890001K',
      invoiceNumber: '12345679/G34',
      invoiceDate: '01-01-2024',
      invoiceType: 'F1',
      totalTaxAmount: '12.35',
      totalAmount: '123.45',
      previousHash:
        '3C464DAF61ACB827C65FDA19F352A4E3BDC2C640E9E9FC4CC058073F38F12F60',
      generatedAt: '2024-01-01T19:20:35+01:00',
    });

    expect(result).toBe(
      'F7B94CFD8924EDFF273501B01EE5153E4CE8F259766F88CF6ACB8935802A2B97',
    );
  });

  it('trata 12.30 y 12.3 como el mismo valor', () => {
    const commonInput = {
      issuerTaxId: '89890001K',
      invoiceNumber: 'F-2026-000001',
      invoiceDate: '25-07-2026',
      invoiceType: 'F1' as const,
      totalAmount: '393.25',
      previousHash: null,
      generatedAt: '2026-07-25T13:07:16+02:00',
    };

    const first = calculateVerifactuAltaHash({
      ...commonInput,
      totalTaxAmount: '12.30',
    });

    const second = calculateVerifactuAltaHash({
      ...commonInput,
      totalTaxAmount: '12.3',
    });

    expect(first).toBe(second);
  });

  it('admite importes negativos para registros rectificativos', () => {
    const hash = calculateVerifactuAltaHash({
      issuerTaxId: 'B12345678',
      invoiceNumber: 'R-2026-000001',
      invoiceDate: '25-07-2026',
      invoiceType: 'R1',
      totalTaxAmount: '-8.40',
      totalAmount: '-48.40',
      previousHash: null,
      generatedAt: '2026-07-25T13:07:16+02:00',
    });

    expect(hash).toMatch(/^[A-F0-9]{64}$/);
  });

  it('rechaza una huella anterior inválida', () => {
    expect(() =>
      calculateVerifactuAltaHash({
        issuerTaxId: 'B12345678',
        invoiceNumber: 'F-2026-000001',
        invoiceDate: '25-07-2026',
        invoiceType: 'F1',
        totalTaxAmount: '68.25',
        totalAmount: '393.25',
        previousHash: 'HUELLA-INVALIDA',
        generatedAt: '2026-07-25T13:07:16+02:00',
      }),
    ).toThrow('La huella anterior debe contener 64 caracteres hexadecimales.');
  });

  it('rechaza una fecha sin huso horario', () => {
    expect(() =>
      calculateVerifactuAltaHash({
        issuerTaxId: 'B12345678',
        invoiceNumber: 'F-2026-000001',
        invoiceDate: '25-07-2026',
        invoiceType: 'F1',
        totalTaxAmount: '68.25',
        totalAmount: '393.25',
        previousHash: null,
        generatedAt: '2026-07-25T13:07:16',
      }),
    ).toThrow(
      'FechaHoraHusoGenRegistro debe incluir fecha, hora, segundos y huso horario.',
    );
  });
});

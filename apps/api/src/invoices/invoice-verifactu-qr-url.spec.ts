import { buildVerifactuQrUrl } from './invoice-verifactu-qr-url';

describe('buildVerifactuQrUrl', () => {
  it('genera la URL del entorno de pruebas VERI*FACTU', () => {
    const result = buildVerifactuQrUrl({
      environment: 'test',
      issuerTaxId: '89890001K',
      invoiceNumber: '12345678-G33',
      issuedAt: new Date('2024-09-01T10:00:00.000Z'),
      totalAmount: '241.40',
    });

    expect(result).toBe(
      'https://prewww2.aeat.es/wlpl/TIKE-CONT/ValidarQR?nif=89890001K&numserie=12345678-G33&fecha=01-09-2024&importe=241.4',
    );
  });

  it('genera la URL del entorno de producción', () => {
    const result = buildVerifactuQrUrl({
      environment: 'production',
      issuerTaxId: 'B12345678',
      invoiceNumber: 'F-2026-000001',
      issuedAt: new Date('2026-07-25T11:07:16.808Z'),
      totalAmount: '393.25',
    });

    expect(result).toBe(
      'https://www2.agenciatributaria.gob.es/wlpl/TIKE-CONT/ValidarQR?nif=B12345678&numserie=F-2026-000001&fecha=25-07-2026&importe=393.25',
    );
  });

  it('codifica correctamente caracteres especiales', () => {
    const result = buildVerifactuQrUrl({
      environment: 'test',
      issuerTaxId: '89890001K',
      invoiceNumber: '12345678&G33',
      issuedAt: new Date('2024-01-01T10:00:00.000Z'),
      totalAmount: '241.4',
    });

    expect(result).toContain('numserie=12345678%26G33');
  });

  it('rechaza un NIF con formato incorrecto', () => {
    expect(() =>
      buildVerifactuQrUrl({
        environment: 'test',
        issuerTaxId: 'B000',
        invoiceNumber: 'F-2026-000001',
        issuedAt: new Date(),
        totalAmount: '393.25',
      }),
    ).toThrow(
      'El NIF del emisor debe contener exactamente 9 caracteres alfanuméricos.',
    );
  });

  it('rechaza importes con coma decimal', () => {
    expect(() =>
      buildVerifactuQrUrl({
        environment: 'test',
        issuerTaxId: 'B12345678',
        invoiceNumber: 'F-2026-000001',
        issuedAt: new Date(),
        totalAmount: '393,25',
      }),
    ).toThrow(
      'El importe total debe ser positivo, usar punto decimal y tener como máximo dos decimales.',
    );
  });
});

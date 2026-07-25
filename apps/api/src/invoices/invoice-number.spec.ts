import { formatInvoiceNumber } from './invoice-number';

describe('formatInvoiceNumber', () => {
  it('genera un número de factura con seis posiciones', () => {
    expect(formatInvoiceNumber('F', 2026, 1, 6)).toBe('F-2026-000001');
  });

  it('normaliza el código de serie a mayúsculas', () => {
    expect(formatInvoiceNumber('taller', 2026, 42, 4)).toBe('TALLER-2026-0042');
  });

  it('no recorta números mayores que el relleno', () => {
    expect(formatInvoiceNumber('F', 2026, 1234567, 6)).toBe('F-2026-1234567');
  });
});

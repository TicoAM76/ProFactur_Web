import {
  formatMadridFiscalDateTime,
  formatMadridInvoiceDate,
} from './verifactu-datetime';

describe('VERI*FACTU Madrid date formatting', () => {
  it('formatea una fecha de verano con UTC+02:00', () => {
    const date = new Date('2026-07-25T11:07:16.808Z');

    expect(formatMadridInvoiceDate(date)).toBe('25-07-2026');

    expect(formatMadridFiscalDateTime(date)).toBe('2026-07-25T13:07:16+02:00');
  });

  it('formatea una fecha de invierno con UTC+01:00', () => {
    const date = new Date('2026-01-15T11:07:16.000Z');

    expect(formatMadridInvoiceDate(date)).toBe('15-01-2026');

    expect(formatMadridFiscalDateTime(date)).toBe('2026-01-15T12:07:16+01:00');
  });

  it('rechaza fechas inválidas', () => {
    expect(() =>
      formatMadridFiscalDateTime(new Date('fecha-invalida')),
    ).toThrow('La fecha fiscal no es válida.');
  });
});

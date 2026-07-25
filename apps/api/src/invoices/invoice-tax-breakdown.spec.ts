import { buildTaxBreakdown } from './invoice-tax-breakdown';

describe('buildTaxBreakdown', () => {
  it('agrupa varias líneas con el mismo tipo de IVA', () => {
    const result = buildTaxBreakdown([
      {
        taxRate: '21',
        netAmount: '285',
        taxAmount: '59.85',
      },
      {
        taxRate: '21',
        netAmount: '40',
        taxAmount: '8.4',
      },
    ]);

    expect(result).toEqual([
      {
        taxRate: '21.00',
        netAmount: '325.00',
        taxAmount: '68.25',
      },
    ]);
  });

  it('separa y ordena diferentes tipos impositivos', () => {
    const result = buildTaxBreakdown([
      {
        taxRate: '21',
        netAmount: '100',
        taxAmount: '21',
      },
      {
        taxRate: '4',
        netAmount: '50',
        taxAmount: '2',
      },
      {
        taxRate: '10',
        netAmount: '80',
        taxAmount: '8',
      },
    ]);

    expect(result).toEqual([
      {
        taxRate: '4.00',
        netAmount: '50.00',
        taxAmount: '2.00',
      },
      {
        taxRate: '10.00',
        netAmount: '80.00',
        taxAmount: '8.00',
      },
      {
        taxRate: '21.00',
        netAmount: '100.00',
        taxAmount: '21.00',
      },
    ]);
  });

  it('admite líneas exentas o con IVA cero', () => {
    const result = buildTaxBreakdown([
      {
        taxRate: '0',
        netAmount: '125.50',
        taxAmount: '0',
      },
    ]);

    expect(result).toEqual([
      {
        taxRate: '0.00',
        netAmount: '125.50',
        taxAmount: '0.00',
      },
    ]);
  });

  it('admite importes negativos para futuras rectificativas', () => {
    const result = buildTaxBreakdown([
      {
        taxRate: '21',
        netAmount: '-40',
        taxAmount: '-8.40',
      },
    ]);

    expect(result).toEqual([
      {
        taxRate: '21.00',
        netAmount: '-40.00',
        taxAmount: '-8.40',
      },
    ]);
  });
});

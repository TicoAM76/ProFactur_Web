import { BadRequestException } from '@nestjs/common';
import { Prisma } from '../generated/prisma/client';
import { calculateInvoiceLine } from './invoice-line-calculator';

describe('calculateInvoiceLine', () => {
  it('calcula correctamente una línea con IVA del 21 %', () => {
    const result = calculateInvoiceLine({
      quantity: new Prisma.Decimal('1'),
      unitPrice: new Prisma.Decimal('285.00'),
      discountRate: new Prisma.Decimal('0'),
      taxRate: new Prisma.Decimal('21.00'),
    });

    expect(result.netAmount.toFixed(2)).toBe('285.00');
    expect(result.taxAmount.toFixed(2)).toBe('59.85');
    expect(result.totalAmount.toFixed(2)).toBe('344.85');
  });

  it('aplica correctamente un descuento', () => {
    const result = calculateInvoiceLine({
      quantity: new Prisma.Decimal('1'),
      unitPrice: new Prisma.Decimal('100.00'),
      discountRate: new Prisma.Decimal('10.00'),
      taxRate: new Prisma.Decimal('21.00'),
    });

    expect(result.netAmount.toFixed(2)).toBe('90.00');
    expect(result.taxAmount.toFixed(2)).toBe('18.90');
    expect(result.totalAmount.toFixed(2)).toBe('108.90');
  });

  it('rechaza cantidades iguales a cero', () => {
    expect(() =>
      calculateInvoiceLine({
        quantity: new Prisma.Decimal('0'),
        unitPrice: new Prisma.Decimal('100.00'),
        discountRate: new Prisma.Decimal('0'),
        taxRate: new Prisma.Decimal('21.00'),
      }),
    ).toThrow(BadRequestException);
  });
});

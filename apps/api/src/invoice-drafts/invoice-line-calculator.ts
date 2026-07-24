import { BadRequestException } from '@nestjs/common';
import { Prisma } from '../generated/prisma/client';

interface CalculateInvoiceLineInput {
  quantity: Prisma.Decimal;
  unitPrice: Prisma.Decimal;
  discountRate: Prisma.Decimal;
  taxRate: Prisma.Decimal;
}

export interface CalculatedInvoiceLine {
  netAmount: Prisma.Decimal;
  taxAmount: Prisma.Decimal;
  totalAmount: Prisma.Decimal;
}

function roundMoney(value: Prisma.Decimal): Prisma.Decimal {
  return value.toDecimalPlaces(2);
}

export function calculateInvoiceLine(
  input: CalculateInvoiceLineInput,
): CalculatedInvoiceLine {
  if (input.quantity.lessThanOrEqualTo(0)) {
    throw new BadRequestException('La cantidad debe ser mayor que cero.');
  }

  if (input.unitPrice.isNegative()) {
    throw new BadRequestException('El precio unitario no puede ser negativo.');
  }

  if (input.discountRate.isNegative() || input.discountRate.greaterThan(100)) {
    throw new BadRequestException('El descuento debe estar entre 0 y 100.');
  }

  if (input.taxRate.isNegative() || input.taxRate.greaterThan(100)) {
    throw new BadRequestException('El tipo de IVA debe estar entre 0 y 100.');
  }

  const grossAmount = input.quantity.mul(input.unitPrice);

  const discountAmount = grossAmount.mul(input.discountRate).div(100);

  const netAmount = roundMoney(grossAmount.minus(discountAmount));

  const taxAmount = roundMoney(netAmount.mul(input.taxRate).div(100));

  const totalAmount = roundMoney(netAmount.plus(taxAmount));

  return {
    netAmount,
    taxAmount,
    totalAmount,
  };
}

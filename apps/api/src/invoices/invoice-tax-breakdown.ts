export interface InvoiceTaxSourceLine {
  taxRate: string;
  netAmount: string;
  taxAmount: string;
}

export interface InvoiceTaxBreakdownRow {
  taxRate: string;
  netAmount: string;
  taxAmount: string;
}

function normalizeTaxRate(value: string): string {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    throw new Error(`Tipo de IVA no válido: ${value}`);
  }

  return numericValue.toFixed(2);
}

function moneyToCents(value: string): bigint {
  const normalized = value.trim();

  const match = normalized.match(/^(-?)(\d+)(?:\.(\d{1,2}))?$/);

  if (!match) {
    throw new Error(`Importe monetario no válido: ${value}`);
  }

  const sign = match[1] === '-' ? -1n : 1n;
  const wholePart = BigInt(match[2]);
  const decimalPart = BigInt((match[3] ?? '').padEnd(2, '0'));

  return sign * (wholePart * 100n + decimalPart);
}

function centsToMoneyString(value: bigint): string {
  const negative = value < 0n;
  const absoluteValue = negative ? -value : value;

  const wholePart = absoluteValue / 100n;
  const decimalPart = absoluteValue % 100n;

  return [
    negative ? '-' : '',
    wholePart.toString(),
    '.',
    decimalPart.toString().padStart(2, '0'),
  ].join('');
}

export function buildTaxBreakdown(
  lines: InvoiceTaxSourceLine[],
): InvoiceTaxBreakdownRow[] {
  const grouped = new Map<
    string,
    {
      netAmount: bigint;
      taxAmount: bigint;
    }
  >();

  for (const line of lines) {
    const taxRate = normalizeTaxRate(line.taxRate);

    const current = grouped.get(taxRate) ?? {
      netAmount: 0n,
      taxAmount: 0n,
    };

    current.netAmount += moneyToCents(line.netAmount);
    current.taxAmount += moneyToCents(line.taxAmount);

    grouped.set(taxRate, current);
  }

  return Array.from(grouped.entries())
    .sort(([firstRate], [secondRate]) => Number(firstRate) - Number(secondRate))
    .map(([taxRate, amounts]) => ({
      taxRate,
      netAmount: centsToMoneyString(amounts.netAmount),
      taxAmount: centsToMoneyString(amounts.taxAmount),
    }));
}

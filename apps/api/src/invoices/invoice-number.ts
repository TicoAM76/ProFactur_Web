export function formatInvoiceNumber(
  seriesCode: string,
  year: number,
  number: number,
  padding: number,
): string {
  const normalizedCode = seriesCode.trim().toUpperCase();
  const paddedNumber = String(number).padStart(padding, '0');

  return `${normalizedCode}-${year}-${paddedNumber}`;
}

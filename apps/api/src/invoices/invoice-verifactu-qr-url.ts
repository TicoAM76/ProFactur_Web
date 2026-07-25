export type AeatEnvironment = 'test' | 'production';

export interface VerifactuQrUrlInput {
  environment: AeatEnvironment;
  issuerTaxId: string;
  invoiceNumber: string;
  issuedAt: Date;
  totalAmount: string;
}

const AEAT_VERIFACTU_QR_BASE_URLS: Record<AeatEnvironment, string> = {
  test: 'https://prewww2.aeat.es/wlpl/TIKE-CONT/ValidarQR',
  production: 'https://www2.agenciatributaria.gob.es/wlpl/TIKE-CONT/ValidarQR',
};

function normalizeIssuerTaxId(value: string): string {
  const normalized = value.trim().toUpperCase();

  if (!/^[A-Z0-9]{9}$/.test(normalized)) {
    throw new Error(
      'El NIF del emisor debe contener exactamente 9 caracteres alfanuméricos.',
    );
  }

  return normalized;
}

function normalizeInvoiceNumber(value: string): string {
  const normalized = value.trim();

  if (!normalized) {
    throw new Error('La serie y número de factura son obligatorios.');
  }

  if (normalized.length > 60) {
    throw new Error(
      'La serie y número de factura no pueden superar 60 caracteres.',
    );
  }

  if (!/^[\x20-\x7E]+$/.test(normalized)) {
    throw new Error(
      'La serie y número de factura solo pueden contener caracteres ASCII imprimibles.',
    );
  }

  return normalized;
}

function normalizeTotalAmount(value: string): string {
  const normalized = value.trim();

  const match = normalized.match(/^(\d{1,12})(?:\.(\d{1,2}))?$/);

  if (!match) {
    throw new Error(
      'El importe total debe ser positivo, usar punto decimal y tener como máximo dos decimales.',
    );
  }

  const integerPart = BigInt(match[1]).toString();

  const decimalPart = (match[2] ?? '').replace(/0+$/, '');

  return decimalPart ? `${integerPart}.${decimalPart}` : integerPart;
}

function formatAeatInvoiceDate(date: Date): string {
  if (Number.isNaN(date.getTime())) {
    throw new Error('La fecha de expedición de la factura no es válida.');
  }

  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Madrid',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).formatToParts(date);

  const day = parts.find((part) => part.type === 'day')?.value;

  const month = parts.find((part) => part.type === 'month')?.value;

  const year = parts.find((part) => part.type === 'year')?.value;

  if (!day || !month || !year) {
    throw new Error('No fue posible formatear la fecha de expedición.');
  }

  return `${day}-${month}-${year}`;
}

export function buildVerifactuQrUrl(input: VerifactuQrUrlInput): string {
  const baseUrl = AEAT_VERIFACTU_QR_BASE_URLS[input.environment];

  const url = new URL(baseUrl);

  url.searchParams.set('nif', normalizeIssuerTaxId(input.issuerTaxId));

  url.searchParams.set('numserie', normalizeInvoiceNumber(input.invoiceNumber));

  url.searchParams.set('fecha', formatAeatInvoiceDate(input.issuedAt));

  url.searchParams.set('importe', normalizeTotalAmount(input.totalAmount));

  return url.toString();
}

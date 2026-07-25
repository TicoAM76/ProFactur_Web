import { createHash } from 'node:crypto';

export type VerifactuInvoiceType =
  'F1' | 'F2' | 'F3' | 'R1' | 'R2' | 'R3' | 'R4' | 'R5';

export interface VerifactuAltaHashInput {
  issuerTaxId: string;
  invoiceNumber: string;
  invoiceDate: string;
  invoiceType: VerifactuInvoiceType;
  totalTaxAmount: string;
  totalAmount: string;
  previousHash: string | null;
  generatedAt: string;
}

function normalizeText(fieldName: string, value: string): string {
  const normalized = value.trim();

  if (!normalized) {
    throw new Error(`${fieldName} es obligatorio.`);
  }

  return normalized;
}

function normalizeIssuerTaxId(value: string): string {
  const normalized = normalizeText('IDEmisorFactura', value).toUpperCase();

  if (!/^[A-Z0-9]{9}$/.test(normalized)) {
    throw new Error(
      'IDEmisorFactura debe contener 9 caracteres alfanuméricos.',
    );
  }

  return normalized;
}

function normalizeInvoiceNumber(value: string): string {
  const normalized = normalizeText('NumSerieFactura', value);

  if (normalized.length > 60) {
    throw new Error('NumSerieFactura no puede superar 60 caracteres.');
  }

  if (!/^[\x20-\x7E]+$/.test(normalized)) {
    throw new Error(
      'NumSerieFactura solo puede contener caracteres ASCII imprimibles.',
    );
  }

  return normalized;
}

function normalizeInvoiceDate(value: string): string {
  const normalized = normalizeText('FechaExpedicionFactura', value);

  const match = normalized.match(/^(\d{2})-(\d{2})-(\d{4})$/);

  if (!match) {
    throw new Error('FechaExpedicionFactura debe usar el formato DD-MM-AAAA.');
  }

  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);

  const date = new Date(Date.UTC(year, month - 1, day));

  const valid =
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day;

  if (!valid) {
    throw new Error('FechaExpedicionFactura no contiene una fecha válida.');
  }

  return normalized;
}

function normalizeDecimal(fieldName: string, value: string): string {
  const normalized = value.trim();

  const match = normalized.match(/^(-?)(\d+)(?:\.(\d{1,2}))?$/);

  if (!match) {
    throw new Error(
      `${fieldName} debe usar punto decimal y tener como máximo dos decimales.`,
    );
  }

  const sign = match[1] === '-' ? '-' : '';

  const integerPart = BigInt(match[2]).toString();

  const decimalPart = (match[3] ?? '').replace(/0+$/, '');

  const numericValue = decimalPart
    ? `${integerPart}.${decimalPart}`
    : integerPart;

  if (numericValue === '0') {
    return '0';
  }

  return `${sign}${numericValue}`;
}

function normalizePreviousHash(value: string | null): string {
  if (value === null || value.trim() === '') {
    return '';
  }

  const normalized = value.trim().toUpperCase();

  if (!/^[A-F0-9]{64}$/.test(normalized)) {
    throw new Error(
      'La huella anterior debe contener 64 caracteres hexadecimales.',
    );
  }

  return normalized;
}

function normalizeGeneratedAt(value: string): string {
  const normalized = normalizeText('FechaHoraHusoGenRegistro', value);

  const pattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}[+-]\d{2}:\d{2}$/;

  if (!pattern.test(normalized)) {
    throw new Error(
      'FechaHoraHusoGenRegistro debe incluir fecha, hora, segundos y huso horario.',
    );
  }

  const parsed = Date.parse(normalized);

  if (Number.isNaN(parsed)) {
    throw new Error('FechaHoraHusoGenRegistro no es válida.');
  }

  return normalized;
}

export function buildVerifactuAltaHashInput(
  input: VerifactuAltaHashInput,
): string {
  const values = {
    issuerTaxId: normalizeIssuerTaxId(input.issuerTaxId),
    invoiceNumber: normalizeInvoiceNumber(input.invoiceNumber),
    invoiceDate: normalizeInvoiceDate(input.invoiceDate),
    invoiceType: input.invoiceType,
    totalTaxAmount: normalizeDecimal('CuotaTotal', input.totalTaxAmount),
    totalAmount: normalizeDecimal('ImporteTotal', input.totalAmount),
    previousHash: normalizePreviousHash(input.previousHash),
    generatedAt: normalizeGeneratedAt(input.generatedAt),
  };

  return [
    `IDEmisorFactura=${values.issuerTaxId}`,
    `NumSerieFactura=${values.invoiceNumber}`,
    `FechaExpedicionFactura=${values.invoiceDate}`,
    `TipoFactura=${values.invoiceType}`,
    `CuotaTotal=${values.totalTaxAmount}`,
    `ImporteTotal=${values.totalAmount}`,
    `Huella=${values.previousHash}`,
    `FechaHoraHusoGenRegistro=${values.generatedAt}`,
  ].join('&');
}

export function calculateVerifactuAltaHash(
  input: VerifactuAltaHashInput,
): string {
  const hashInput = buildVerifactuAltaHashInput(input);

  return createHash('sha256')
    .update(hashInput, 'utf8')
    .digest('hex')
    .toUpperCase();
}

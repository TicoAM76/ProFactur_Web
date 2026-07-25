import { buildTaxBreakdown } from '../invoices/invoice-tax-breakdown';
import { VerifactuSifConfig } from './verifactu-sif-config';

const SOAP_NAMESPACE = 'http://schemas.xmlsoap.org/soap/envelope/';

const SUPPLY_NAMESPACE =
  'https://www2.agenciatributaria.gob.es/static_files/common/internet/dep/aplicaciones/es/aeat/tike/cont/ws/SuministroLR.xsd';

const INFORMATION_NAMESPACE =
  'https://www2.agenciatributaria.gob.es/static_files/common/internet/dep/aplicaciones/es/aeat/tike/cont/ws/SuministroInformacion.xsd';

export interface VerifactuAltaXmlLine {
  taxRate: string;
  netAmount: string;
  taxAmount: string;
}

export interface VerifactuPreviousRecordXmlData {
  issuerTaxId: string;
  invoiceNumber: string;
  invoiceDate: string;
  hash: string;
}

export interface VerifactuAltaXmlInput {
  issuerName: string;
  issuerTaxId: string;

  invoiceNumber: string;
  invoiceDate: string;
  description: string;

  customerName: string;
  customerTaxId: string;

  totalTaxAmount: string;
  totalAmount: string;
  lines: VerifactuAltaXmlLine[];

  previousRecord: VerifactuPreviousRecordXmlData | null;

  generatedAtWithOffset: string;
  hash: string;

  sif: VerifactuSifConfig;
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function requireText(
  fieldName: string,
  value: string,
  maximumLength: number,
): string {
  const normalized = value.trim();

  if (!normalized) {
    throw new Error(`${fieldName} es obligatorio.`);
  }

  if (normalized.length > maximumLength) {
    throw new Error(
      `${fieldName} no puede superar ${maximumLength} caracteres.`,
    );
  }

  return normalized;
}

function normalizeTaxId(fieldName: string, value: string): string {
  const normalized = value.trim().toUpperCase();

  if (!/^[A-Z0-9]{9}$/.test(normalized)) {
    throw new Error(`${fieldName} debe contener 9 caracteres alfanumericos.`);
  }

  return normalized;
}

function normalizeInvoiceDate(value: string): string {
  const normalized = value.trim();
  const match = normalized.match(/^(\d{2})-(\d{2})-(\d{4})$/);

  if (!match) {
    throw new Error('invoiceDate debe usar el formato DD-MM-AAAA.');
  }

  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    throw new Error('invoiceDate no contiene una fecha valida.');
  }

  return normalized;
}

function normalizeDateTimeWithOffset(value: string): string {
  const normalized = value.trim();

  if (
    !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}[+-]\d{2}:\d{2}$/.test(normalized) ||
    Number.isNaN(Date.parse(normalized))
  ) {
    throw new Error(
      'generatedAtWithOffset debe incluir fecha, hora, segundos y huso horario.',
    );
  }

  return normalized;
}

function normalizeDecimal(fieldName: string, value: string): string {
  const normalized = value.trim();
  const match = normalized.match(/^(-?)(\d+)(?:\.(\d{1,2}))?$/);

  if (!match) {
    throw new Error(
      `${fieldName} debe usar punto decimal y tener como maximo dos decimales.`,
    );
  }

  const sign = match[1] === '-' ? '-' : '';
  const integerPart = BigInt(match[2]).toString();
  const decimalPart = (match[3] ?? '').replace(/0+$/, '');
  const absoluteValue = decimalPart
    ? `${integerPart}.${decimalPart}`
    : integerPart;

  if (absoluteValue === '0') {
    return '0';
  }

  return `${sign}${absoluteValue}`;
}

function normalizeHash(fieldName: string, value: string): string {
  const normalized = value.trim().toUpperCase();

  if (!/^[A-F0-9]{64}$/.test(normalized)) {
    throw new Error(`${fieldName} debe contener 64 caracteres hexadecimales.`);
  }

  return normalized;
}

function element(prefix: 'sum' | 'sum1', name: string, value: string): string {
  return `<${prefix}:${name}>${escapeXml(value)}</${prefix}:${name}>`;
}

function buildEncadenamiento(
  previousRecord: VerifactuPreviousRecordXmlData | null,
): string {
  if (!previousRecord) {
    return [
      '<sum1:Encadenamiento>',
      element('sum1', 'PrimerRegistro', 'S'),
      '</sum1:Encadenamiento>',
    ].join('');
  }

  const issuerTaxId = normalizeTaxId(
    'previousRecord.issuerTaxId',
    previousRecord.issuerTaxId,
  );

  const invoiceNumber = requireText(
    'previousRecord.invoiceNumber',
    previousRecord.invoiceNumber,
    60,
  );

  const invoiceDate = normalizeInvoiceDate(previousRecord.invoiceDate);

  const hash = normalizeHash('previousRecord.hash', previousRecord.hash);

  return [
    '<sum1:Encadenamiento>',
    '<sum1:RegistroAnterior>',
    element('sum1', 'IDEmisorFactura', issuerTaxId),
    element('sum1', 'NumSerieFactura', invoiceNumber),
    element('sum1', 'FechaExpedicionFactura', invoiceDate),
    element('sum1', 'Huella', hash),
    '</sum1:RegistroAnterior>',
    '</sum1:Encadenamiento>',
  ].join('');
}

function buildSistemaInformatico(sif: VerifactuSifConfig): string {
  return [
    '<sum1:SistemaInformatico>',
    element('sum1', 'NombreRazon', sif.producerName),
    element('sum1', 'NIF', sif.producerTaxId),
    element('sum1', 'NombreSistemaInformatico', sif.systemName),
    element('sum1', 'IdSistemaInformatico', sif.systemId),
    element('sum1', 'Version', sif.version),
    element('sum1', 'NumeroInstalacion', sif.installationNumber),
    element('sum1', 'TipoUsoPosibleSoloVerifactu', sif.onlyVerifactu),
    element('sum1', 'TipoUsoPosibleMultiOT', sif.supportsMultipleTaxpayers),
    element('sum1', 'IndicadorMultiplesOT', sif.currentlyMultipleTaxpayers),
    '</sum1:SistemaInformatico>',
  ].join('');
}

function buildDesglose(lines: VerifactuAltaXmlLine[]): string {
  if (lines.length === 0) {
    throw new Error('No se puede generar el XML fiscal sin desglose de IVA.');
  }

  const rows = buildTaxBreakdown(lines);

  const details = rows.map((row) => {
    const taxRate = normalizeDecimal('taxRate', row.taxRate);
    const netAmount = normalizeDecimal('netAmount', row.netAmount);
    const taxAmount = normalizeDecimal('taxAmount', row.taxAmount);

    return [
      '<sum1:DetalleDesglose>',
      element('sum1', 'ClaveRegimen', '01'),
      element('sum1', 'CalificacionOperacion', 'S1'),
      element('sum1', 'TipoImpositivo', taxRate),
      element('sum1', 'BaseImponibleOimporteNoSujeto', netAmount),
      element('sum1', 'CuotaRepercutida', taxAmount),
      '</sum1:DetalleDesglose>',
    ].join('');
  });

  return ['<sum1:Desglose>', ...details, '</sum1:Desglose>'].join('');
}

export function buildVerifactuAltaSoapXml(
  input: VerifactuAltaXmlInput,
): string {
  const issuerName = requireText('issuerName', input.issuerName, 120);

  const issuerTaxId = normalizeTaxId('issuerTaxId', input.issuerTaxId);

  const invoiceNumber = requireText('invoiceNumber', input.invoiceNumber, 60);

  const invoiceDate = normalizeInvoiceDate(input.invoiceDate);

  const description = requireText('description', input.description, 500);

  const customerName = requireText('customerName', input.customerName, 120);

  const customerTaxId = normalizeTaxId('customerTaxId', input.customerTaxId);

  const totalTaxAmount = normalizeDecimal(
    'totalTaxAmount',
    input.totalTaxAmount,
  );

  const totalAmount = normalizeDecimal('totalAmount', input.totalAmount);

  const generatedAtWithOffset = normalizeDateTimeWithOffset(
    input.generatedAtWithOffset,
  );

  const hash = normalizeHash('hash', input.hash);

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    `<soapenv:Envelope xmlns:soapenv="${SOAP_NAMESPACE}" xmlns:sum="${SUPPLY_NAMESPACE}" xmlns:sum1="${INFORMATION_NAMESPACE}">`,
    '<soapenv:Header/>',
    '<soapenv:Body>',
    '<sum:RegFactuSistemaFacturacion>',
    '<sum:Cabecera>',
    '<sum1:ObligadoEmision>',
    element('sum1', 'NombreRazon', issuerName),
    element('sum1', 'NIF', issuerTaxId),
    '</sum1:ObligadoEmision>',
    '</sum:Cabecera>',
    '<sum:RegistroFactura>',
    '<sum1:RegistroAlta>',
    element('sum1', 'IDVersion', '1.0'),
    '<sum1:IDFactura>',
    element('sum1', 'IDEmisorFactura', issuerTaxId),
    element('sum1', 'NumSerieFactura', invoiceNumber),
    element('sum1', 'FechaExpedicionFactura', invoiceDate),
    '</sum1:IDFactura>',
    element('sum1', 'NombreRazonEmisor', issuerName),
    element('sum1', 'TipoFactura', 'F1'),
    element('sum1', 'DescripcionOperacion', description),
    '<sum1:Destinatarios>',
    '<sum1:IDDestinatario>',
    element('sum1', 'NombreRazon', customerName),
    element('sum1', 'NIF', customerTaxId),
    '</sum1:IDDestinatario>',
    '</sum1:Destinatarios>',
    buildDesglose(input.lines),
    element('sum1', 'CuotaTotal', totalTaxAmount),
    element('sum1', 'ImporteTotal', totalAmount),
    buildEncadenamiento(input.previousRecord),
    buildSistemaInformatico(input.sif),
    element('sum1', 'FechaHoraHusoGenRegistro', generatedAtWithOffset),
    element('sum1', 'TipoHuella', '01'),
    element('sum1', 'Huella', hash),
    '</sum1:RegistroAlta>',
    '</sum:RegistroFactura>',
    '</sum:RegFactuSistemaFacturacion>',
    '</soapenv:Body>',
    '</soapenv:Envelope>',
  ].join('');
}

import { XMLParser } from 'fast-xml-parser';

export type AeatSubmissionStatus =
  'Correcto' | 'ParcialmenteCorrecto' | 'Incorrecto';

export type AeatRecordStatus = 'Correcto' | 'AceptadoConErrores' | 'Incorrecto';

export type AeatOperationType = 'Alta' | 'Anulacion';

export type AeatDuplicateRecordStatus =
  'Correcta' | 'AceptadaConErrores' | 'Anulada';

export interface AeatDuplicateRecord {
  requestId: string;
  status: AeatDuplicateRecordStatus;
  errorCode: string | null;
  errorDescription: string | null;
}

export interface AeatResponseLine {
  issuerTaxId: string;
  invoiceNumber: string;
  invoiceDate: string;
  operation: AeatOperationType;
  externalReference: string | null;
  status: AeatRecordStatus;
  errorCode: string | null;
  errorDescription: string | null;
  duplicateRecord: AeatDuplicateRecord | null;
}

export interface AeatSubmissionResponse {
  kind: 'submission';
  csv: string | null;
  presenterTaxId: string | null;
  presentationTimestamp: string | null;
  waitSeconds: string;
  status: AeatSubmissionStatus;
  lines: AeatResponseLine[];
}

export interface AeatSoapFault {
  kind: 'fault';
  faultCode: string;
  faultString: string;
  detail: string | null;
}

export type ParsedAeatSoapResponse = AeatSubmissionResponse | AeatSoapFault;

type UnknownRecord = Record<string, unknown>;

const parser = new XMLParser({
  ignoreAttributes: false,
  removeNSPrefix: true,
  trimValues: true,
  parseTagValue: false,
  parseAttributeValue: false,
});

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function requireRecord(value: unknown, context: string): UnknownRecord {
  if (!isRecord(value)) {
    throw new Error(
      `La respuesta AEAT no contiene ${context} con una estructura válida.`,
    );
  }

  return value;
}

function requireString(
  record: UnknownRecord,
  key: string,
  context: string,
): string {
  const value = record[key];

  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(`La respuesta AEAT no contiene ${context}.${key}.`);
  }

  return value.trim();
}

function optionalString(record: UnknownRecord, key: string): string | null {
  const value = record[key];

  if (value === undefined || value === null) {
    return null;
  }

  if (typeof value !== 'string') {
    throw new Error(
      `El campo opcional ${key} de la respuesta AEAT no es texto.`,
    );
  }

  const normalized = value.trim();

  return normalized || null;
}

function normalizeDetail(value: unknown): string | null {
  if (value === undefined || value === null) {
    return null;
  }

  if (typeof value === 'string') {
    return value.trim() || null;
  }

  return JSON.stringify(value);
}

function asArray(value: unknown): unknown[] {
  if (value === undefined || value === null) {
    return [];
  }

  return Array.isArray(value) ? value : [value];
}

function assertOneOf<T extends string>(
  value: string,
  allowed: readonly T[],
  fieldName: string,
): T {
  if (!allowed.includes(value as T)) {
    throw new Error(
      `La AEAT devolvió un valor no reconocido en ${fieldName}: ${value}.`,
    );
  }

  return value as T;
}

function parseSoapFault(faultValue: unknown): AeatSoapFault {
  const fault = requireRecord(faultValue, 'SOAP Fault');

  return {
    kind: 'fault',
    faultCode: requireString(fault, 'faultcode', 'SOAP Fault'),
    faultString: requireString(fault, 'faultstring', 'SOAP Fault'),
    detail: normalizeDetail(fault.detail),
  };
}

function parseDuplicateRecord(value: unknown): AeatDuplicateRecord | null {
  if (value === undefined || value === null) {
    return null;
  }

  const duplicate = requireRecord(value, 'RegistroDuplicado');

  const status = assertOneOf(
    requireString(duplicate, 'EstadoRegistroDuplicado', 'RegistroDuplicado'),
    ['Correcta', 'AceptadaConErrores', 'Anulada'] as const,
    'EstadoRegistroDuplicado',
  );

  return {
    requestId: requireString(
      duplicate,
      'IdPeticionRegistroDuplicado',
      'RegistroDuplicado',
    ),
    status,
    errorCode: optionalString(duplicate, 'CodigoErrorRegistro'),
    errorDescription: optionalString(duplicate, 'DescripcionErrorRegistro'),
  };
}

function parseResponseLine(value: unknown): AeatResponseLine {
  const line = requireRecord(value, 'RespuestaLinea');
  const invoiceId = requireRecord(line.IDFactura, 'RespuestaLinea.IDFactura');
  const operation = requireRecord(line.Operacion, 'RespuestaLinea.Operacion');

  return {
    issuerTaxId: requireString(
      invoiceId,
      'IDEmisorFactura',
      'RespuestaLinea.IDFactura',
    ),
    invoiceNumber: requireString(
      invoiceId,
      'NumSerieFactura',
      'RespuestaLinea.IDFactura',
    ),
    invoiceDate: requireString(
      invoiceId,
      'FechaExpedicionFactura',
      'RespuestaLinea.IDFactura',
    ),
    operation: assertOneOf(
      requireString(operation, 'TipoOperacion', 'RespuestaLinea.Operacion'),
      ['Alta', 'Anulacion'] as const,
      'TipoOperacion',
    ),
    externalReference: optionalString(line, 'RefExterna'),
    status: assertOneOf(
      requireString(line, 'EstadoRegistro', 'RespuestaLinea'),
      ['Correcto', 'AceptadoConErrores', 'Incorrecto'] as const,
      'EstadoRegistro',
    ),
    errorCode: optionalString(line, 'CodigoErrorRegistro'),
    errorDescription: optionalString(line, 'DescripcionErrorRegistro'),
    duplicateRecord: parseDuplicateRecord(line.RegistroDuplicado),
  };
}

function parseSubmissionResponse(value: unknown): AeatSubmissionResponse {
  const response = requireRecord(value, 'RespuestaRegFactuSistemaFacturacion');

  const presentation = response.DatosPresentacion;
  const presentationRecord =
    presentation === undefined
      ? null
      : requireRecord(presentation, 'DatosPresentacion');

  const lines = asArray(response.RespuestaLinea).map(parseResponseLine);

  return {
    kind: 'submission',
    csv: optionalString(response, 'CSV'),
    presenterTaxId: presentationRecord
      ? requireString(presentationRecord, 'NIFPresentador', 'DatosPresentacion')
      : null,
    presentationTimestamp: presentationRecord
      ? requireString(
          presentationRecord,
          'TimestampPresentacion',
          'DatosPresentacion',
        )
      : null,
    waitSeconds: requireString(
      response,
      'TiempoEsperaEnvio',
      'RespuestaRegFactuSistemaFacturacion',
    ),
    status: assertOneOf(
      requireString(
        response,
        'EstadoEnvio',
        'RespuestaRegFactuSistemaFacturacion',
      ),
      ['Correcto', 'ParcialmenteCorrecto', 'Incorrecto'] as const,
      'EstadoEnvio',
    ),
    lines,
  };
}

export function parseAeatSoapResponse(xml: string): ParsedAeatSoapResponse {
  const normalizedXml = xml.trim();

  if (!normalizedXml) {
    throw new Error('La respuesta SOAP de la AEAT está vacía.');
  }

  let parsed: unknown;

  try {
    parsed = parser.parse(normalizedXml) as unknown;
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Error XML desconocido';

    throw new Error(
      `La respuesta SOAP de la AEAT no es XML válido: ${message}`,
    );
  }

  const document = requireRecord(parsed, 'documento XML');
  const envelope = requireRecord(document.Envelope, 'SOAP Envelope');
  const body = requireRecord(envelope.Body, 'SOAP Body');

  if (body.Fault !== undefined) {
    return parseSoapFault(body.Fault);
  }

  return parseSubmissionResponse(body.RespuestaRegFactuSistemaFacturacion);
}

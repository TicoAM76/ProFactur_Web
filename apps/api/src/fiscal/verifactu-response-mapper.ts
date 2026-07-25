import { FiscalRecordState } from '../generated/prisma/client';
import {
  AeatOperationType,
  AeatRecordStatus,
  AeatSubmissionStatus,
  ParsedAeatSoapResponse,
} from './verifactu-response-parser';

export interface ExpectedFiscalRecordIdentity {
  issuerTaxId: string;
  invoiceNumber: string;
  invoiceDate: string;
  operation: AeatOperationType;
}

export interface MappedAeatSubmissionResult {
  kind: 'submission';
  globalStatus: AeatSubmissionStatus;
  recordStatus: AeatRecordStatus;
  fiscalRecordState: FiscalRecordState;
  csv: string | null;
  presenterTaxId: string | null;
  presentationTimestamp: string | null;
  waitSeconds: number;
  errorCode: string | null;
  errorDescription: string | null;
  duplicateRequestId: string | null;
  duplicateStatus: string | null;
}

export interface MappedAeatSoapFaultResult {
  kind: 'fault';
  fiscalRecordState: FiscalRecordState;
  faultCode: string;
  faultString: string;
  detail: string | null;
}

export type MappedAeatResponse =
  MappedAeatSubmissionResult | MappedAeatSoapFaultResult;

function normalizeWaitSeconds(value: string): number {
  const normalized = value.trim();

  if (!/^\d+$/.test(normalized)) {
    throw new Error(
      `La AEAT devolvió un TiempoEsperaEnvio inválido: ${value}.`,
    );
  }

  const result = Number(normalized);

  if (!Number.isSafeInteger(result) || result < 0) {
    throw new Error(
      `La AEAT devolvió un TiempoEsperaEnvio fuera de rango: ${value}.`,
    );
  }

  return result;
}

function mapRecordStatus(status: AeatRecordStatus): FiscalRecordState {
  switch (status) {
    case 'Correcto':
      return FiscalRecordState.ACCEPTED;

    case 'AceptadoConErrores':
      return FiscalRecordState.ACCEPTED_WITH_ERRORS;

    case 'Incorrecto':
      return FiscalRecordState.REJECTED;
  }
}

export function mapAeatResponseToFiscalRecord(
  response: ParsedAeatSoapResponse,
  expected: ExpectedFiscalRecordIdentity,
): MappedAeatResponse {
  if (response.kind === 'fault') {
    return {
      kind: 'fault',
      fiscalRecordState: FiscalRecordState.PENDING_SUBMISSION,
      faultCode: response.faultCode,
      faultString: response.faultString,
      detail: response.detail,
    };
  }

  const matchingLines = response.lines.filter(
    (line) =>
      line.issuerTaxId === expected.issuerTaxId &&
      line.invoiceNumber === expected.invoiceNumber &&
      line.invoiceDate === expected.invoiceDate &&
      line.operation === expected.operation,
  );

  if (matchingLines.length === 0) {
    throw new Error(
      'La respuesta AEAT no contiene una línea que coincida con el registro enviado.',
    );
  }

  if (matchingLines.length > 1) {
    throw new Error(
      'La respuesta AEAT contiene más de una línea para el mismo registro enviado.',
    );
  }

  const line = matchingLines[0];

  return {
    kind: 'submission',
    globalStatus: response.status,
    recordStatus: line.status,
    fiscalRecordState: mapRecordStatus(line.status),
    csv: response.csv,
    presenterTaxId: response.presenterTaxId,
    presentationTimestamp: response.presentationTimestamp,
    waitSeconds: normalizeWaitSeconds(response.waitSeconds),
    errorCode: line.errorCode,
    errorDescription: line.errorDescription,
    duplicateRequestId: line.duplicateRecord?.requestId ?? null,
    duplicateStatus: line.duplicateRecord?.status ?? null,
  };
}

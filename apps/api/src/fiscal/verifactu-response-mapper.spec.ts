import { FiscalRecordState } from '../generated/prisma/client';
import {
  AeatSubmissionResponse,
  ParsedAeatSoapResponse,
} from './verifactu-response-parser';
import { mapAeatResponseToFiscalRecord } from './verifactu-response-mapper';

const expectedIdentity = {
  issuerTaxId: 'B00000000',
  invoiceNumber: 'F-2026-000004',
  invoiceDate: '25-07-2026',
  operation: 'Alta' as const,
};

function buildSubmissionResponse(
  status: 'Correcto' | 'AceptadoConErrores' | 'Incorrecto',
): AeatSubmissionResponse {
  return {
    kind: 'submission',
    csv: status === 'Incorrecto' ? null : 'CSV1234567890123',
    presenterTaxId: 'B12345678',
    presentationTimestamp: '2026-07-25T14:30:00+02:00',
    waitSeconds: '60',
    status:
      status === 'Correcto'
        ? 'Correcto'
        : status === 'AceptadoConErrores'
          ? 'ParcialmenteCorrecto'
          : 'Incorrecto',
    lines: [
      {
        ...expectedIdentity,
        externalReference: null,
        status,
        errorCode: status === 'Correcto' ? null : '4100',
        errorDescription:
          status === 'Correcto' ? null : 'Descripción de prueba',
        duplicateRecord: null,
      },
    ],
  };
}

describe('mapAeatResponseToFiscalRecord', () => {
  it('mapea un registro correcto como ACCEPTED', () => {
    const result = mapAeatResponseToFiscalRecord(
      buildSubmissionResponse('Correcto'),
      expectedIdentity,
    );

    expect(result).toMatchObject({
      kind: 'submission',
      fiscalRecordState: FiscalRecordState.ACCEPTED,
      recordStatus: 'Correcto',
      csv: 'CSV1234567890123',
      waitSeconds: 60,
      errorCode: null,
    });
  });

  it('mapea un registro aceptado con errores', () => {
    const result = mapAeatResponseToFiscalRecord(
      buildSubmissionResponse('AceptadoConErrores'),
      expectedIdentity,
    );

    expect(result).toMatchObject({
      kind: 'submission',
      fiscalRecordState: FiscalRecordState.ACCEPTED_WITH_ERRORS,
      recordStatus: 'AceptadoConErrores',
      errorCode: '4100',
      errorDescription: 'Descripción de prueba',
    });
  });

  it('mapea un registro incorrecto como REJECTED', () => {
    const result = mapAeatResponseToFiscalRecord(
      buildSubmissionResponse('Incorrecto'),
      expectedIdentity,
    );

    expect(result).toMatchObject({
      kind: 'submission',
      fiscalRecordState: FiscalRecordState.REJECTED,
      recordStatus: 'Incorrecto',
      csv: null,
      errorCode: '4100',
    });
  });

  it('mantiene pendiente un SOAP Fault para permitir corrección y reenvío', () => {
    const response: ParsedAeatSoapResponse = {
      kind: 'fault',
      faultCode: 'soapenv:Client',
      faultString: 'Error de estructura',
      detail: 'Detalle de prueba',
    };

    expect(mapAeatResponseToFiscalRecord(response, expectedIdentity)).toEqual({
      kind: 'fault',
      fiscalRecordState: FiscalRecordState.PENDING_SUBMISSION,
      faultCode: 'soapenv:Client',
      faultString: 'Error de estructura',
      detail: 'Detalle de prueba',
    });
  });

  it('rechaza una respuesta sin línea coincidente', () => {
    const response = buildSubmissionResponse('Correcto');

    response.lines[0].invoiceNumber = 'F-2026-999999';

    expect(() =>
      mapAeatResponseToFiscalRecord(response, expectedIdentity),
    ).toThrow(
      'La respuesta AEAT no contiene una línea que coincida con el registro enviado.',
    );
  });

  it('rechaza un tiempo de espera inválido', () => {
    const response = buildSubmissionResponse('Correcto');

    response.waitSeconds = 'sesenta';

    expect(() =>
      mapAeatResponseToFiscalRecord(response, expectedIdentity),
    ).toThrow('La AEAT devolvió un TiempoEsperaEnvio inválido: sesenta.');
  });
});

import { parseAeatSoapResponse } from './verifactu-response-parser';

const SOAP_START = `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope
  xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"
  xmlns:sfR="https://www2.agenciatributaria.gob.es/static_files/common/internet/dep/aplicaciones/es/aeat/tike/cont/ws/RespuestaSuministro.xsd"
  xmlns:sf="https://www2.agenciatributaria.gob.es/static_files/common/internet/dep/aplicaciones/es/aeat/tike/cont/ws/SuministroInformacion.xsd">
  <soapenv:Body>`;

const SOAP_END = `
  </soapenv:Body>
</soapenv:Envelope>`;

describe('parseAeatSoapResponse', () => {
  it('interpreta un envío correcto con una línea aceptada', () => {
    const xml = `${SOAP_START}
      <sfR:RespuestaRegFactuSistemaFacturacion>
        <sfR:CSV>CSV-TEST-001</sfR:CSV>
        <sfR:DatosPresentacion>
          <sf:NIFPresentador>B12345678</sf:NIFPresentador>
          <sf:TimestampPresentacion>2026-07-25T15:20:30+02:00</sf:TimestampPresentacion>
        </sfR:DatosPresentacion>
        <sfR:Cabecera>
          <sf:ObligadoEmision>
            <sf:NombreRazon>Taller FacturTaller Pruebas S.L.</sf:NombreRazon>
            <sf:NIF>B00000000</sf:NIF>
          </sf:ObligadoEmision>
        </sfR:Cabecera>
        <sfR:TiempoEsperaEnvio>60</sfR:TiempoEsperaEnvio>
        <sfR:EstadoEnvio>Correcto</sfR:EstadoEnvio>
        <sfR:RespuestaLinea>
          <sfR:IDFactura>
            <sf:IDEmisorFactura>B00000000</sf:IDEmisorFactura>
            <sf:NumSerieFactura>F-2026-000004</sf:NumSerieFactura>
            <sf:FechaExpedicionFactura>25-07-2026</sf:FechaExpedicionFactura>
          </sfR:IDFactura>
          <sfR:Operacion>
            <sf:TipoOperacion>Alta</sf:TipoOperacion>
          </sfR:Operacion>
          <sfR:EstadoRegistro>Correcto</sfR:EstadoRegistro>
        </sfR:RespuestaLinea>
      </sfR:RespuestaRegFactuSistemaFacturacion>${SOAP_END}`;

    expect(parseAeatSoapResponse(xml)).toEqual({
      kind: 'submission',
      csv: 'CSV-TEST-001',
      presenterTaxId: 'B12345678',
      presentationTimestamp: '2026-07-25T15:20:30+02:00',
      waitSeconds: '60',
      status: 'Correcto',
      lines: [
        {
          issuerTaxId: 'B00000000',
          invoiceNumber: 'F-2026-000004',
          invoiceDate: '25-07-2026',
          operation: 'Alta',
          externalReference: null,
          status: 'Correcto',
          errorCode: null,
          errorDescription: null,
          duplicateRecord: null,
        },
      ],
    });
  });

  it('interpreta un registro aceptado con errores', () => {
    const xml = `${SOAP_START}
      <sfR:RespuestaRegFactuSistemaFacturacion>
        <sfR:CSV>CSV-TEST-002</sfR:CSV>
        <sfR:Cabecera>
          <sf:ObligadoEmision>
            <sf:NombreRazon>Taller FacturTaller Pruebas S.L.</sf:NombreRazon>
            <sf:NIF>B00000000</sf:NIF>
          </sf:ObligadoEmision>
        </sfR:Cabecera>
        <sfR:TiempoEsperaEnvio>60</sfR:TiempoEsperaEnvio>
        <sfR:EstadoEnvio>Correcto</sfR:EstadoEnvio>
        <sfR:RespuestaLinea>
          <sfR:IDFactura>
            <sf:IDEmisorFactura>B00000000</sf:IDEmisorFactura>
            <sf:NumSerieFactura>F-2026-000004</sf:NumSerieFactura>
            <sf:FechaExpedicionFactura>25-07-2026</sf:FechaExpedicionFactura>
          </sfR:IDFactura>
          <sfR:Operacion>
            <sf:TipoOperacion>Alta</sf:TipoOperacion>
          </sfR:Operacion>
          <sfR:EstadoRegistro>AceptadoConErrores</sfR:EstadoRegistro>
          <sfR:CodigoErrorRegistro>2000</sfR:CodigoErrorRegistro>
          <sfR:DescripcionErrorRegistro>Advertencia de prueba</sfR:DescripcionErrorRegistro>
        </sfR:RespuestaLinea>
      </sfR:RespuestaRegFactuSistemaFacturacion>${SOAP_END}`;

    const result = parseAeatSoapResponse(xml);

    expect(result.kind).toBe('submission');

    if (result.kind !== 'submission') {
      throw new Error('Se esperaba una respuesta de suministro.');
    }

    expect(result.lines[0]).toMatchObject({
      status: 'AceptadoConErrores',
      errorCode: '2000',
      errorDescription: 'Advertencia de prueba',
    });
  });

  it('interpreta un rechazo por registro duplicado', () => {
    const xml = `${SOAP_START}
      <sfR:RespuestaRegFactuSistemaFacturacion>
        <sfR:Cabecera>
          <sf:ObligadoEmision>
            <sf:NombreRazon>Taller FacturTaller Pruebas S.L.</sf:NombreRazon>
            <sf:NIF>B00000000</sf:NIF>
          </sf:ObligadoEmision>
        </sfR:Cabecera>
        <sfR:TiempoEsperaEnvio>60</sfR:TiempoEsperaEnvio>
        <sfR:EstadoEnvio>Incorrecto</sfR:EstadoEnvio>
        <sfR:RespuestaLinea>
          <sfR:IDFactura>
            <sf:IDEmisorFactura>B00000000</sf:IDEmisorFactura>
            <sf:NumSerieFactura>F-2026-000004</sf:NumSerieFactura>
            <sf:FechaExpedicionFactura>25-07-2026</sf:FechaExpedicionFactura>
          </sfR:IDFactura>
          <sfR:Operacion>
            <sf:TipoOperacion>Alta</sf:TipoOperacion>
          </sfR:Operacion>
          <sfR:EstadoRegistro>Incorrecto</sfR:EstadoRegistro>
          <sfR:CodigoErrorRegistro>3000</sfR:CodigoErrorRegistro>
          <sfR:DescripcionErrorRegistro>Registro duplicado</sfR:DescripcionErrorRegistro>
          <sfR:RegistroDuplicado>
            <sf:IdPeticionRegistroDuplicado>PETICION-001</sf:IdPeticionRegistroDuplicado>
            <sf:EstadoRegistroDuplicado>Correcta</sf:EstadoRegistroDuplicado>
          </sfR:RegistroDuplicado>
        </sfR:RespuestaLinea>
      </sfR:RespuestaRegFactuSistemaFacturacion>${SOAP_END}`;

    const result = parseAeatSoapResponse(xml);

    expect(result.kind).toBe('submission');

    if (result.kind !== 'submission') {
      throw new Error('Se esperaba una respuesta de suministro.');
    }

    expect(result.csv).toBeNull();
    expect(result.lines[0].duplicateRecord).toEqual({
      requestId: 'PETICION-001',
      status: 'Correcta',
      errorCode: null,
      errorDescription: null,
    });
  });

  it('interpreta un SOAP Fault', () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
      <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/">
        <soapenv:Body>
          <soapenv:Fault>
            <faultcode>soapenv:Client</faultcode>
            <faultstring>XML no válido</faultstring>
            <detail>Error de estructura</detail>
          </soapenv:Fault>
        </soapenv:Body>
      </soapenv:Envelope>`;

    expect(parseAeatSoapResponse(xml)).toEqual({
      kind: 'fault',
      faultCode: 'soapenv:Client',
      faultString: 'XML no válido',
      detail: 'Error de estructura',
    });
  });

  it('rechaza una respuesta vacía', () => {
    expect(() => parseAeatSoapResponse('   ')).toThrow(
      'La respuesta SOAP de la AEAT está vacía.',
    );
  });
});

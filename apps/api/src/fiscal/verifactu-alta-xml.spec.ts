import {
  buildVerifactuAltaSoapXml,
  VerifactuAltaXmlInput,
} from './verifactu-alta-xml';

const SIF = {
  producerName: 'RN Soluciones Digitales',
  producerTaxId: 'B12345678',
  systemName: 'FacturTaller',
  systemId: 'PF',
  version: '0.1.0',
  installationNumber: '1',
  onlyVerifactu: 'S' as const,
  supportsMultipleTaxpayers: 'S' as const,
  currentlyMultipleTaxpayers: 'N' as const,
};

const HASH = 'C5D8029A880A81DA193C2430684A8DE55398F09A4FD337B2FD1C7BDEA8F1C47A';

const PREVIOUS_HASH =
  '5DF1FFA7FC33356B037286761F8D1705CA1CC2FD6A561650EAA9603DC3A07468';

function createInput(
  overrides: Partial<VerifactuAltaXmlInput> = {},
): VerifactuAltaXmlInput {
  return {
    issuerName: 'Taller FacturTaller Pruebas S.L.',
    issuerTaxId: 'B00000000',
    invoiceNumber: 'F-2026-000004',
    invoiceDate: '25-07-2026',
    description: 'Diagnostico electronico del vehiculo',
    customerName: 'Rafael Alberto Felipe Feliu',
    customerTaxId: '09845729G',
    totalTaxAmount: '7.35',
    totalAmount: '42.35',
    lines: [
      {
        taxRate: '21',
        netAmount: '35',
        taxAmount: '7.35',
      },
    ],
    previousRecord: {
      issuerTaxId: 'B00000000',
      invoiceNumber: 'F-2026-000003',
      invoiceDate: '25-07-2026',
      hash: PREVIOUS_HASH,
    },
    generatedAtWithOffset: '2026-07-25T13:20:00+02:00',
    hash: HASH,
    sif: SIF,
    ...overrides,
  };
}

describe('buildVerifactuAltaSoapXml', () => {
  it('genera un SOAP de alta encadenada', () => {
    const xml = buildVerifactuAltaSoapXml(createInput());

    expect(xml).toContain('<sum:RegFactuSistemaFacturacion>');
    expect(xml).toContain('<sum1:RegistroAlta>');
    expect(xml).toContain(
      '<sum1:NumSerieFactura>F-2026-000004</sum1:NumSerieFactura>',
    );
    expect(xml).toContain('<sum1:RegistroAnterior>');
    expect(xml).toContain(`<sum1:Huella>${PREVIOUS_HASH}</sum1:Huella>`);
    expect(xml).not.toContain('<sum1:PrimerRegistro>');
    expect(xml).toContain(
      '<sum1:IdSistemaInformatico>PF</sum1:IdSistemaInformatico>',
    );
    expect(xml).toContain(`<sum1:Huella>${HASH}</sum1:Huella>`);
  });

  it('marca correctamente el primer registro de la cadena', () => {
    const xml = buildVerifactuAltaSoapXml(
      createInput({
        invoiceNumber: 'F-2026-000003',
        previousRecord: null,
      }),
    );

    expect(xml).toContain('<sum1:PrimerRegistro>S</sum1:PrimerRegistro>');
    expect(xml).not.toContain('<sum1:RegistroAnterior>');
  });

  it('agrupa líneas con el mismo tipo impositivo', () => {
    const xml = buildVerifactuAltaSoapXml(
      createInput({
        totalTaxAmount: '8.40',
        totalAmount: '48.40',
        lines: [
          {
            taxRate: '21',
            netAmount: '20',
            taxAmount: '4.20',
          },
          {
            taxRate: '21.00',
            netAmount: '20.00',
            taxAmount: '4.20',
          },
        ],
      }),
    );

    expect(xml.match(/<sum1:DetalleDesglose>/g)).toHaveLength(1);
    expect(xml).toContain(
      '<sum1:BaseImponibleOimporteNoSujeto>40</sum1:BaseImponibleOimporteNoSujeto>',
    );
    expect(xml).toContain('<sum1:CuotaRepercutida>8.4</sum1:CuotaRepercutida>');
  });

  it('escapa caracteres especiales de XML', () => {
    const xml = buildVerifactuAltaSoapXml(
      createInput({
        issuerName: 'Taller A & B <Pruebas>',
        description: 'Revision & reparacion <urgente>',
      }),
    );

    expect(xml).toContain('Taller A &amp; B &lt;Pruebas&gt;');
    expect(xml).toContain('Revision &amp; reparacion &lt;urgente&gt;');
  });

  it('rechaza huellas con formato incorrecto', () => {
    expect(() =>
      buildVerifactuAltaSoapXml(createInput({ hash: 'INVALIDA' })),
    ).toThrow('hash debe contener 64 caracteres hexadecimales.');
  });
});

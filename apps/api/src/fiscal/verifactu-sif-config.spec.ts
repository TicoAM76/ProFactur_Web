import { loadVerifactuSifConfig } from './verifactu-sif-config';

describe('loadVerifactuSifConfig', () => {
  const validEnvironment = {
    VERIFACTU_SIF_PRODUCER_NAME: 'Profactur Desarrollo',
    VERIFACTU_SIF_PRODUCER_TAX_ID: 'B12345678',
    VERIFACTU_SIF_NAME: 'Profactur',
    VERIFACTU_SIF_ID: 'PROFACTUR',
    VERIFACTU_SIF_VERSION: '0.1.0',
    VERIFACTU_INSTALLATION_NUMBER: '1',
    VERIFACTU_SIF_ONLY_VERIFACTU: 'S',
    VERIFACTU_SIF_SUPPORTS_MULTIPLE_TAXPAYERS: 'S',
    VERIFACTU_SIF_CURRENT_MULTIPLE_TAXPAYERS: 'N',
  };

  it('carga la identidad completa del sistema', () => {
    expect(loadVerifactuSifConfig(validEnvironment)).toEqual({
      producerName: 'Profactur Desarrollo',
      producerTaxId: 'B12345678',
      systemName: 'Profactur',
      systemId: 'PROFACTUR',
      version: '0.1.0',
      installationNumber: '1',
      onlyVerifactu: 'S',
      supportsMultipleTaxpayers: 'S',
      currentlyMultipleTaxpayers: 'N',
    });
  });

  it('normaliza el NIF y los indicadores', () => {
    const result = loadVerifactuSifConfig({
      ...validEnvironment,
      VERIFACTU_SIF_PRODUCER_TAX_ID: 'b12345678',
      VERIFACTU_SIF_ONLY_VERIFACTU: 's',
    });

    expect(result.producerTaxId).toBe('B12345678');
    expect(result.onlyVerifactu).toBe('S');
  });

  it('rechaza una variable obligatoria ausente', () => {
    const environment: Record<string, string | undefined> = {
      ...validEnvironment,
    };

    delete environment.VERIFACTU_SIF_NAME;

    expect(() => loadVerifactuSifConfig(environment)).toThrow(
      'La variable VERIFACTU_SIF_NAME es obligatoria.',
    );
  });

  it('rechaza indicadores distintos de S o N', () => {
    expect(() =>
      loadVerifactuSifConfig({
        ...validEnvironment,
        VERIFACTU_SIF_ONLY_VERIFACTU: 'SI',
      }),
    ).toThrow('VERIFACTU_SIF_ONLY_VERIFACTU debe ser S o N.');
  });

  it('rechaza un NIF de productor incorrecto', () => {
    expect(() =>
      loadVerifactuSifConfig({
        ...validEnvironment,
        VERIFACTU_SIF_PRODUCER_TAX_ID: 'B123',
      }),
    ).toThrow(
      'VERIFACTU_SIF_PRODUCER_TAX_ID debe contener 9 caracteres alfanumericos.',
    );
  });
});

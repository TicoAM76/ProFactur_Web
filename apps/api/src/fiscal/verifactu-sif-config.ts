export type VerifactuYesNo = 'S' | 'N';

export interface VerifactuSifConfig {
  producerName: string;
  producerTaxId: string;
  systemName: string;
  systemId: string;
  version: string;
  installationNumber: string;
  onlyVerifactu: VerifactuYesNo;
  supportsMultipleTaxpayers: VerifactuYesNo;
  currentlyMultipleTaxpayers: VerifactuYesNo;
}

type EnvironmentSource = Record<string, string | undefined>;

function requireValue(environment: EnvironmentSource, name: string): string {
  const value = environment[name]?.trim();

  if (!value) {
    throw new Error(`La variable ${name} es obligatoria.`);
  }

  return value;
}

function normalizeSpanishTaxId(value: string): string {
  const normalized = value.trim().toUpperCase();

  if (!/^[A-Z0-9]{9}$/.test(normalized)) {
    throw new Error(
      'VERIFACTU_SIF_PRODUCER_TAX_ID debe contener 9 caracteres alfanumericos.',
    );
  }

  return normalized;
}

function normalizeYesNo(value: string, variableName: string): VerifactuYesNo {
  const normalized = value.trim().toUpperCase();

  if (normalized !== 'S' && normalized !== 'N') {
    throw new Error(`${variableName} debe ser S o N.`);
  }

  return normalized;
}

function ensureMaximumLength(
  value: string,
  maximumLength: number,
  variableName: string,
): string {
  if (value.length > maximumLength) {
    throw new Error(
      `${variableName} no puede superar ${maximumLength} caracteres.`,
    );
  }

  return value;
}

export function loadVerifactuSifConfig(
  environment: EnvironmentSource = process.env,
): VerifactuSifConfig {
  const producerName = ensureMaximumLength(
    requireValue(environment, 'VERIFACTU_SIF_PRODUCER_NAME'),
    120,
    'VERIFACTU_SIF_PRODUCER_NAME',
  );

  const producerTaxId = normalizeSpanishTaxId(
    requireValue(environment, 'VERIFACTU_SIF_PRODUCER_TAX_ID'),
  );

  const systemName = ensureMaximumLength(
    requireValue(environment, 'VERIFACTU_SIF_NAME'),
    100,
    'VERIFACTU_SIF_NAME',
  );

  const systemId = ensureMaximumLength(
    requireValue(environment, 'VERIFACTU_SIF_ID'),
    30,
    'VERIFACTU_SIF_ID',
  );

  const version = ensureMaximumLength(
    requireValue(environment, 'VERIFACTU_SIF_VERSION'),
    50,
    'VERIFACTU_SIF_VERSION',
  );

  const installationNumber = ensureMaximumLength(
    requireValue(environment, 'VERIFACTU_INSTALLATION_NUMBER'),
    50,
    'VERIFACTU_INSTALLATION_NUMBER',
  );

  return {
    producerName,
    producerTaxId,
    systemName,
    systemId,
    version,
    installationNumber,

    onlyVerifactu: normalizeYesNo(
      requireValue(environment, 'VERIFACTU_SIF_ONLY_VERIFACTU'),
      'VERIFACTU_SIF_ONLY_VERIFACTU',
    ),

    supportsMultipleTaxpayers: normalizeYesNo(
      requireValue(environment, 'VERIFACTU_SIF_SUPPORTS_MULTIPLE_TAXPAYERS'),
      'VERIFACTU_SIF_SUPPORTS_MULTIPLE_TAXPAYERS',
    ),

    currentlyMultipleTaxpayers: normalizeYesNo(
      requireValue(environment, 'VERIFACTU_SIF_CURRENT_MULTIPLE_TAXPAYERS'),
      'VERIFACTU_SIF_CURRENT_MULTIPLE_TAXPAYERS',
    ),
  };
}

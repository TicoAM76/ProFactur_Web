import { VerifactuSifConfig } from '../fiscal/verifactu-sif-config';
import {
  DemoDocumentReadiness,
  DemoDocumentSnapshotLine,
} from './demo-document.types';

const DEMO_FOOTER_LINES = [
  'Estructura validada contra el XSD oficial.',
  'Registro y XML preparados para prueba de integración.',
  'Pendiente de certificado válido y envío real en TEST.',
] as const;

export function getDemoFooterLines(): readonly string[] {
  return DEMO_FOOTER_LINES;
}

export function buildDemoVerificationUrl(token: string): string {
  const baseUrl = (
    process.env.PROFACTUR_DEMO_VERIFY_BASE_URL ??
    'http://localhost:3001/demo/verify'
  )
    .trim()
    .replace(/\/+$/, '');

  return `${baseUrl}/${encodeURIComponent(token)}`;
}

export function buildDemoOperationDescription(
  lines: DemoDocumentSnapshotLine[],
  notes: string | null,
): string {
  const concepts = lines
    .map((line) => line.description.trim())
    .filter(Boolean)
    .join('; ');

  const combined = [concepts, notes?.trim()].filter(Boolean).join('. ');

  return (combined || 'Documento demostrativo generado por Profactur').slice(
    0,
    500,
  );
}

function requiredEnvironmentValue(
  name: string,
  fallback: string,
  maximumLength: number,
): string {
  const value = (process.env[name] ?? fallback).trim();

  if (!value) {
    throw new Error(`${name} no puede estar vacío.`);
  }

  if (value.length > maximumLength) {
    throw new Error(`${name} no puede superar ${maximumLength} caracteres.`);
  }

  return value;
}

function yesNoEnvironmentValue(name: string, fallback: 'S' | 'N'): 'S' | 'N' {
  const value = (process.env[name] ?? fallback).trim().toUpperCase();

  if (value !== 'S' && value !== 'N') {
    throw new Error(`${name} debe ser S o N.`);
  }

  return value;
}

export function resolveDemoSifConfig(): VerifactuSifConfig {
  return {
    producerName: requiredEnvironmentValue(
      'VERIFACTU_SIF_PRODUCER_NAME',
      'Profactur Desarrollo',
      120,
    ),
    producerTaxId: requiredEnvironmentValue(
      'VERIFACTU_SIF_PRODUCER_TAX_ID',
      'B12345678',
      9,
    ).toUpperCase(),
    systemName: requiredEnvironmentValue('VERIFACTU_SIF_NAME', 'Profactur', 30),
    systemId: requiredEnvironmentValue('VERIFACTU_SIF_ID', 'PF', 2),
    version: requiredEnvironmentValue('VERIFACTU_SIF_VERSION', '0.1.0', 50),
    installationNumber: requiredEnvironmentValue(
      'VERIFACTU_INSTALLATION_NUMBER',
      '1',
      100,
    ),
    onlyVerifactu: yesNoEnvironmentValue('ONLY_VERIFACTU', 'S'),
    supportsMultipleTaxpayers: yesNoEnvironmentValue(
      'SUPPORTS_MULTIPLE_TAXPAYERS',
      'S',
    ),
    currentlyMultipleTaxpayers: yesNoEnvironmentValue(
      'CURRENT_MULTIPLE_TAXPAYERS',
      'N',
    ),
  };
}

export function buildDemoReadiness(): DemoDocumentReadiness {
  return {
    mode: 'DEMO',
    invoiceDataComplete: true,
    taxCalculationValid: true,
    xmlGenerated: true,
    xsdStructureValidated: true,
    xsdValidationScope:
      'La estructura del generador XML fue validada contra los XSD oficiales. Falta la prueba real de transporte y respuesta.',
    fiscalHashGenerated: true,
    qrMode: 'DEMO_NO_AEAT',
    certificateConfigured: false,
    bridgeConfigured: false,
    aeatSubmitted: false,
    aeatAccepted: false,
    remainingSteps: [
      'Instalar Profactur Bridge.',
      'Seleccionar un certificado digital válido.',
      'Enviar el registro al entorno AEAT TEST.',
      'Procesar y conservar la respuesta real de la AEAT.',
    ],
  };
}

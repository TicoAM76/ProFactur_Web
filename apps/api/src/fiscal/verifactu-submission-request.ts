import { createHash } from 'node:crypto';
import { FiscalEnvironment } from '../generated/prisma/client';

const SOAP_ENDPOINTS: Record<FiscalEnvironment, string> = {
  [FiscalEnvironment.TEST]:
    'https://prewww1.aeat.es/wlpl/TIKE-CONT/ws/SistemaFacturacion/VerifactuSOAP',
  [FiscalEnvironment.PRODUCTION]:
    'https://www1.agenciatributaria.gob.es/wlpl/TIKE-CONT/ws/SistemaFacturacion/VerifactuSOAP',
};

export function calculateSubmissionRequestHash(xml: string): string {
  if (!xml.trim()) {
    throw new Error('El XML del envío fiscal no puede estar vacío.');
  }

  return createHash('sha256').update(xml, 'utf8').digest('hex').toUpperCase();
}

export function resolveVerifactuSoapEndpoint(
  environment: FiscalEnvironment,
  override?: string,
): string {
  const candidate = override?.trim() || SOAP_ENDPOINTS[environment];

  const url = new URL(candidate);

  if (url.protocol !== 'https:') {
    throw new Error('El endpoint SOAP VERI*FACTU debe usar HTTPS.');
  }

  if (url.username || url.password) {
    throw new Error(
      'El endpoint SOAP VERI*FACTU no puede contener credenciales.',
    );
  }

  return url.toString();
}

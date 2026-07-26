import { FiscalEnvironment } from '../generated/prisma/client';
import {
  calculateSubmissionRequestHash,
  resolveVerifactuSoapEndpoint,
} from './verifactu-submission-request';

describe('VERI*FACTU submission request', () => {
  it('calcula SHA-256 en hexadecimal mayúsculo', () => {
    expect(calculateSubmissionRequestHash('<Envelope/>')).toBe(
      'CBED3B27295A309DA3CE42224E915B8CCB87354E24D40145475BCA384C21B5F7',
    );
  });

  it('resuelve el endpoint oficial de pruebas', () => {
    expect(resolveVerifactuSoapEndpoint(FiscalEnvironment.TEST)).toBe(
      'https://prewww1.aeat.es/wlpl/TIKE-CONT/ws/SistemaFacturacion/VerifactuSOAP',
    );
  });

  it('resuelve el endpoint oficial de producción', () => {
    expect(resolveVerifactuSoapEndpoint(FiscalEnvironment.PRODUCTION)).toBe(
      'https://www1.agenciatributaria.gob.es/wlpl/TIKE-CONT/ws/SistemaFacturacion/VerifactuSOAP',
    );
  });

  it('permite sobrescribir el endpoint mediante configuración', () => {
    expect(
      resolveVerifactuSoapEndpoint(
        FiscalEnvironment.TEST,
        'https://verifactu.test.local/soap',
      ),
    ).toBe('https://verifactu.test.local/soap');
  });

  it('rechaza endpoints sin HTTPS', () => {
    expect(() =>
      resolveVerifactuSoapEndpoint(
        FiscalEnvironment.TEST,
        'http://verifactu.test.local/soap',
      ),
    ).toThrow('El endpoint SOAP VERI*FACTU debe usar HTTPS.');
  });
});

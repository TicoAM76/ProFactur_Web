import {
  BRIDGE_DISPATCH_TOKEN_TTL_MS,
  BRIDGE_EXECUTION_TOKEN_TTL_MS,
  createBridgeDispatchToken,
  hashBridgeDispatchToken,
} from './bridge-dispatch-token';

describe('bridge-dispatch-token', () => {
  it('genera un token aleatorio de 256 bits y almacena solo su hash', () => {
    const now = new Date('2026-07-29T16:00:00.000Z');

    const result = createBridgeDispatchToken(now);

    expect(result.token).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(result.tokenHash).toMatch(/^[A-F0-9]{64}$/);
    expect(result.tokenHash).not.toBe(result.token);
    expect(result.tokenHash).toBe(hashBridgeDispatchToken(result.token));
    expect(result.expiresAt.toISOString()).toBe('2026-07-29T16:05:00.000Z');
  });

  it('genera valores diferentes en llamadas consecutivas', () => {
    const first = createBridgeDispatchToken();
    const second = createBridgeDispatchToken();

    expect(first.token).not.toBe(second.token);
    expect(first.tokenHash).not.toBe(second.tokenHash);
  });

  it('permite configurar una duración controlada para pruebas', () => {
    const now = new Date('2026-07-29T16:00:00.000Z');

    const result = createBridgeDispatchToken(now, 60_000);

    expect(result.expiresAt.toISOString()).toBe('2026-07-29T16:01:00.000Z');
  });

  it('define cinco minutos para despacho y diez para ejecución', () => {
    expect(BRIDGE_DISPATCH_TOKEN_TTL_MS).toBe(300_000);
    expect(BRIDGE_EXECUTION_TOKEN_TTL_MS).toBe(600_000);
  });

  it('rechaza tokens vacíos al calcular el hash', () => {
    expect(() => hashBridgeDispatchToken('   ')).toThrow(
      'El token de despacho no puede estar vacío.',
    );
  });

  it('rechaza duraciones inválidas', () => {
    expect(() => createBridgeDispatchToken(new Date(), 0)).toThrow(
      'La duración del token de despacho debe ser un entero positivo.',
    );

    expect(() => createBridgeDispatchToken(new Date(), 1.5)).toThrow(
      'La duración del token de despacho debe ser un entero positivo.',
    );
  });
});

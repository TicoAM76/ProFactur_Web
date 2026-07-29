import { createHash, randomBytes } from 'node:crypto';

export const BRIDGE_DISPATCH_TOKEN_TTL_MS = 5 * 60 * 1000;
export const BRIDGE_EXECUTION_TOKEN_TTL_MS = 10 * 60 * 1000;

const BRIDGE_DISPATCH_TOKEN_BYTES = 32;

export interface BridgeDispatchToken {
  token: string;
  tokenHash: string;
  expiresAt: Date;
}

export function hashBridgeDispatchToken(token: string): string {
  const normalized = token.trim();

  if (!normalized) {
    throw new Error('El token de despacho no puede estar vacío.');
  }

  return createHash('sha256')
    .update(normalized, 'utf8')
    .digest('hex')
    .toUpperCase();
}

export function createBridgeDispatchToken(
  now: Date = new Date(),
  ttlMs: number = BRIDGE_DISPATCH_TOKEN_TTL_MS,
): BridgeDispatchToken {
  if (!Number.isSafeInteger(ttlMs) || ttlMs <= 0) {
    throw new Error(
      'La duración del token de despacho debe ser un entero positivo.',
    );
  }

  const token = randomBytes(BRIDGE_DISPATCH_TOKEN_BYTES).toString('base64url');

  return {
    token,
    tokenHash: hashBridgeDispatchToken(token),
    expiresAt: new Date(now.getTime() + ttlMs),
  };
}

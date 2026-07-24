import type { TransformFnParams } from 'class-transformer';

export function normalizeDecimalInput({ value }: TransformFnParams): unknown {
  const rawValue: unknown = value;

  if (rawValue === null || rawValue === undefined) {
    return rawValue;
  }

  if (typeof rawValue === 'string') {
    return rawValue.trim().replace(',', '.');
  }

  if (typeof rawValue === 'number') {
    return String(rawValue);
  }

  return rawValue;
}

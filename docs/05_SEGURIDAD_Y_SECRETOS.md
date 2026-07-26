# Seguridad y secretos

## Prohibiciones

Nunca guardar en Git:

- `.env`
- PFX/P12
- contraseñas
- tokens
- claves privadas
- certificados de clientes
- credenciales de base de datos

## Certificado fiscal

Decisión:

- Permanece local en el equipo del cliente.
- Profactur Cloud no lo recibe.
- Profactur Bridge usa el certificado local.
- Cloud solo guarda metadatos públicos.

## Separación de identidades

- Clave del dispositivo: licencia y autorización.
- Certificado fiscal: autenticación frente a AEAT.

No mezclar.

## Logs

No registrar:

- Contraseñas.
- Claves.
- XML con secretos.
- PFX.
- Tokens completos.

## Docker

- Secretos fuera de la imagen.
- Volúmenes de solo lectura.
- No usar `rejectUnauthorized: false`.
- No imprimir `.env` completo.

## Base de datos

Guardar:

- Hashes.
- Fingerprints.
- Estados.
- Timestamps.
- Auditoría.

No guardar:

- Claves privadas.
- Passphrases.
